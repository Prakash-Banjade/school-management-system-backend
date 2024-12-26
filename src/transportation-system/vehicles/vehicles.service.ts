import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Brackets, DataSource, ILike } from 'typeorm';
import { EStaff } from 'src/common/types/global.type';
import paginatedData from 'src/utils/paginatedData';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { singleVehicleSelectCols, vehicleSelectCols } from './helpers/vehicle-select-cols';
import { VehiclesQueryDto } from './dto/vehicles-query.dto';
import { BaseRepository } from 'src/common/repository/base-repository';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { Staff } from 'src/staffs/entities/staff.entity';
import { Vehicle } from './entities/vehicle.entity';
import { UtilitiesService } from 'src/utilities/utilities.service';
import { BranchesService } from 'src/branches/branches.service';

@Injectable()
export class VehiclesService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly utilitiesService: UtilitiesService,
    private readonly branchService: BranchesService
  ) { super(dataSource, req); }

  async create(createVehicleDto: CreateVehicleDto) {
    const driver = createVehicleDto.driverId ? await this.getRepository(Staff).findOne({
      where: { id: createVehicleDto.driverId, type: EStaff.DRIVER },
      select: { id: true }
    }) : null;

    const vehicle = this.getRepository(Vehicle).create({
      ...createVehicleDto,
      driver,
      branch: await this.branchService.getBranch(this.utilitiesService.getBranchId())
    });

    await this.getRepository(Vehicle).save(vehicle);

    return { message: 'Vehicle added' }
  }

  async findAll(queryDto: VehiclesQueryDto) {
    const querybuilder = this.getRepository(Vehicle).createQueryBuilder('vehicle');

    querybuilder
      .orderBy('vehicle.createdAt', queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .leftJoin('vehicle.driver', 'driver')
      .where(new Brackets(qb => {
        queryDto.search && qb.andWhere({ vehicleNumber: ILike(`%${queryDto.search}%`) })
        queryDto.types?.length && qb.andWhere('vehicle.type IN (:...types)', { types: queryDto.types })
      }));

    applySelectColumns(querybuilder, vehicleSelectCols, 'vehicle');
    this.utilitiesService.applyBranchFilter(querybuilder, 'vehicle.branchId = :branchId');

    return paginatedData(queryDto, querybuilder);
  }

  async getOptions(queryDto: VehiclesQueryDto) {
    const querybuilder = this.getRepository(Vehicle).createQueryBuilder('vehicle')
      .orderBy("vehicle.createdAt", queryDto.order)
      .limit(queryDto.take)
      .offset(queryDto.skip)
      .where(new Brackets(qb => {
        queryDto.search && qb.andWhere({ vehicleNumber: ILike(`%${queryDto.search}%`) })
      }))
      .select([
        "vehicle.id as value",
        "vehicle.vehicleNumber as label",
      ])

    this.utilitiesService.applyBranchFilter(querybuilder, 'vehicle.branchId = :branchId');

    return querybuilder.getRawMany();
  }

  async findOne(id: string) {
    const existing = await this.getRepository(Vehicle).findOne({
      where: {
        id,
        branch: { id: this.utilitiesService.getBranchId() }
      },
      relations: {
        driver: true,
        stops: true,
      },
      select: singleVehicleSelectCols,
    })
    if (!existing) throw new BadRequestException('Vehicle not found');

    return existing;
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto) {
    const existing = await this.findOne(id);

    const driver = updateVehicleDto.driverId
      ? await this.getRepository(Staff).findOne({
        where: { id: updateVehicleDto.driverId, type: EStaff.DRIVER },
        select: { id: true }
      })
      : updateVehicleDto.driverId === null ? null : existing.driver;

    Object.assign(existing, {
      ...updateVehicleDto,
      driver,
    });

    await this.getRepository(Vehicle).save(existing);

    return { message: 'Vehicle updated' }
  }

  async remove(id: string) {
    const existing = await this.getRepository(Vehicle).findOne({
      where: {
        id,
        branch: { id: this.utilitiesService.getBranchId() }
      },
      select: { id: true }
    });
    if (!existing) throw new NotFoundException('Vehicle not found');

    await this.getRepository(Vehicle).remove(existing)

    return { message: 'Vehicle removed' }
  }
}
