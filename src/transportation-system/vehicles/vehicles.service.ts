import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { Brackets, ILike, Repository } from 'typeorm';
import { StaffsService } from 'src/staffs/staffs.service';
import { EStaff } from 'src/common/types/global.type';
import paginatedData from 'src/utils/paginatedData';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { singleVehicleSelectCols, vehicleSelectCols } from './helpers/vehicle-select-cols';
import { VehiclesQueryDto } from './dto/vehicles-query.dto';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle) private readonly vehicleRepo: Repository<Vehicle>,
    private readonly staffsService: StaffsService,
  ) { }

  async create(createVehicleDto: CreateVehicleDto) {
    const driver = createVehicleDto.driverId ? await this.staffsService.findOne(createVehicleDto.driverId, EStaff.DRIVER) : null;

    const vehicle = this.vehicleRepo.create({
      ...createVehicleDto,
      driver,
    });
    await this.vehicleRepo.save(vehicle);

    return {
      message: 'Vehicle added',
    }
  }

  async findAll(queryDto: VehiclesQueryDto) {
    const querybuilder = this.vehicleRepo.createQueryBuilder('vehicle');

    querybuilder
      .orderBy('vehicle.createdAt', queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .leftJoin('vehicle.driver', 'driver')
      .leftJoin('vehicle.stops', 'stops')
      .where(new Brackets(qb => {
        queryDto.search && qb.andWhere({ vehicleNumber: ILike(`%${queryDto.search}%`) })
        queryDto.types?.length && qb.andWhere('vehicle.type IN (:...types)', { types: queryDto.types })
      }))

    applySelectColumns(querybuilder, vehicleSelectCols, 'vehicle');

    return paginatedData(queryDto, querybuilder);
  }

  async getOptions(queryDto: VehiclesQueryDto) {
    return this.vehicleRepo.createQueryBuilder('vehicle')
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
      .getRawMany();
  }
  async findOne(id: string) {
    const existing = await this.vehicleRepo.findOne({
      where: { id },
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
      ? await this.staffsService.findOne(updateVehicleDto.driverId)
      : updateVehicleDto.driverId === null ? null : existing.driver;

    if (driver && driver.type !== EStaff.DRIVER) throw new BadRequestException('Staff is not a driver');

    Object.assign(existing, {
      ...updateVehicleDto,
      driver,
    });

    await this.vehicleRepo.save(existing);

    return {
      message: 'Vehicle updated'
    }
  }

  async remove(id: string) {
    const existing = await this.findOne(id);

    await this.vehicleRepo.remove(existing)

    return {
      message: 'Vehicle removed'
    }
  }
}
