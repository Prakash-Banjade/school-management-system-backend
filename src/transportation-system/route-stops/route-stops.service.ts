import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRouteStopDto } from './dto/create-route-stop.dto';
import { UpdateRouteStopDto } from './dto/update-route-stop.dto';
import { RouteStop } from './entities/route-stop.entity';
import { Brackets, DataSource } from 'typeorm';
import paginatedData from 'src/utils/paginatedData';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { routeStopSelectCols } from './helpers/route-stop-select-cols';
import { RouteStopQueryDto, ERouteStopSortBy } from './dto/route-stop-query.dto';
import { BaseRepository } from 'src/common/repository/base-repository';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { UtilitiesService } from 'src/utilities/utilities.service';
import { BranchesService } from 'src/branches/branches.service';

@Injectable()
export class RouteStopsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly utilitiesService: UtilitiesService,
    private readonly branchService: BranchesService,
  ) { super(dataSource, req); }

  async create(createRouteStopDto: CreateRouteStopDto) {
    const vehicle = await this.getRepository(Vehicle).findOne({ where: { id: createRouteStopDto.vehicleId }, select: { id: true } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const newRouteStop = this.getRepository(RouteStop).create({
      ...createRouteStopDto,
      vehicle,
      branch: await this.branchService.getBranch(this.utilitiesService.getBranchId())
    });
    await this.getRepository(RouteStop).save(newRouteStop);

    return { message: 'Route stop created successfully' }
  }

  findAll(queryDto: RouteStopQueryDto) {
    const queryBuilder = this.getRepository(RouteStop).createQueryBuilder('routeStop');

    queryBuilder
      .orderBy(this.getOrderByKey(queryDto), queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .leftJoinAndSelect('routeStop.vehicle', 'vehicle')
      .where(new Brackets(qb => {
        queryDto.search && (
          qb.orWhere("LOWER(routeStop.name) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
            .orWhere("LOWER(vehicle.vehicleNumber) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
        )
      }));

    this.utilitiesService.applyBranchFilter(queryBuilder, 'routeStop.branchId = :branchId');
    applySelectColumns(queryBuilder, routeStopSelectCols, 'routeStop');

    return paginatedData(queryDto, queryBuilder);
  }

  private getOrderByKey(queryDto: RouteStopQueryDto) {
    switch (queryDto.sortBy) {
      case ERouteStopSortBy.Sequence:
        return 'routeStop.sequence';
      default:
        return 'routeStop.createdAt';
    }
  }

  getOptions(queryDto: RouteStopQueryDto) {
    const querybuilder = this.getRepository(RouteStop).createQueryBuilder('routeStop')
      .limit(queryDto.take)
      .offset(queryDto.skip)
      .leftJoin('routeStop.vehicle', 'vehicle')
      .where(new Brackets(qb => {
        queryDto.search && qb.orWhere("LOWER(routeStop.name) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
          .orWhere("LOWER(vehicle.vehicleNumber) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
      }))
      .select([
        'routeStop.id as value',
        `CASE 
          WHEN vehicle.vehicleNumber IS NOT NULL 
          THEN CONCAT(routeStop.name, ' - ', vehicle.vehicleNumber) 
          ELSE routeStop.name 
        END as label`,
      ]);

    this.utilitiesService.applyBranchFilter(querybuilder, 'routeStop.branchId = :branchId');

    return querybuilder.getRawMany();
  }

  async findOne(id: string) {
    const existing = await this.getRepository(RouteStop).findOne({
      where: { id, branch: { id: this.utilitiesService.getBranchId() } },
      relations: ['vehicle'],
      select: routeStopSelectCols,
    })

    if (!existing) throw new NotFoundException('Route stop not found')

    return existing;
  };

  async findOneWithAvailableSeats(id: string) {
    const queryBuilder = this.getRepository(RouteStop).createQueryBuilder('routeStop')
      .leftJoin('routeStop.vehicle', 'vehicle')
      .leftJoin('routeStop.students', 'students')
      .where('routeStop.id = :id', { id })
      .select([
        'routeStop.id as id',
        'routeStop.name as name',
        'vehicle.capacity as capacity',
        'COUNT(students.id) as studentsCount'
      ]);

    this.utilitiesService.applyBranchFilter(queryBuilder, 'vehicle.branchId = :branchId');

    const existing = await queryBuilder.getRawOne();

    if (!existing) throw new NotFoundException('Route stop not found');

    if (existing.capacity && (existing.studentsCount >= existing.capacity)) throw new BadRequestException('No available seats in vehicle of route stop ' + existing.name);

    return {
      id: existing.id,
      name: existing.name,
      capacity: existing.capacity,
    } as unknown as RouteStop;
  }

  async update(id: string, updateRouteStopDto: UpdateRouteStopDto) {
    const existing = await this.findOne(id);

    // evaluate vehicle
    if (updateRouteStopDto.vehicleId && (updateRouteStopDto.vehicleId !== existing.vehicle?.id || !existing.vehicle)) {
      const vehicle = await this.getRepository(Vehicle).findOne({ where: { id: updateRouteStopDto.vehicleId }, select: { id: true } });
      if (!vehicle) throw new NotFoundException('Vehicle not found');

      existing.vehicle = vehicle;
    }

    Object.assign(existing, {
      ...updateRouteStopDto,
    });

    await this.getRepository(RouteStop).save(existing);

    return { message: 'Route stop updated' }
  }

  async remove(id: string) {
    const existing = await this.getRepository(RouteStop).findOne({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Route stop not found');

    await this.getRepository(RouteStop).remove(existing);

    return { message: 'Route stop removed' }
  }
}
