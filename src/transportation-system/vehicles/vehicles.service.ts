import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { Brackets, ILike, Repository } from 'typeorm';
import { StaffsService } from 'src/staffs/staffs.service';
import { TransportRoutesService } from '../transport-routes/transport-routes.service';
import { EStaff } from 'src/common/types/global.type';
import { QueryDto } from 'src/common/dto/query.dto';
import paginatedData from 'src/utils/paginatedData';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle) private readonly vehicleRepo: Repository<Vehicle>,
    private readonly staffsService: StaffsService,
    private readonly transportRoutesService: TransportRoutesService,
  ) { }

  async create(createVehicleDto: CreateVehicleDto) {
    const driver = await this.staffsService.findOne(createVehicleDto.staffId);
    if (driver.type !== EStaff.DRIVER) throw new BadRequestException('Staff is not a driver');

    // evaluate route
    const transportRoute = createVehicleDto.transportRouteId
      ? await this.transportRoutesService.findOne(createVehicleDto.transportRouteId)
      : null;

    const vehicle = this.vehicleRepo.create({
      ...createVehicleDto,
      driver,
      transportRoute,
    });
    const savedVehicle = await this.vehicleRepo.save(vehicle);

    return this.vehicleMutationReturn(savedVehicle, 'created');
  }

  async findAll(queryDto: QueryDto) {
    const querybuilder = this.vehicleRepo.createQueryBuilder('vehicle');

    querybuilder
      .orderBy('vehicle.createdAt', 'DESC')
      .skip(queryDto.skip)
      .take(queryDto.take)
      .where(new Brackets(qb => {
        queryDto.search && qb.andWhere({ vehicleNumber: ILike(`%${queryDto.search}%`) })
      }))

    return paginatedData(queryDto, querybuilder);
  }

  async findOne(id: string) {
    const existing = await this.vehicleRepo.findOne({
      where: { id },
      relations: {
        driver: true,
        transportRoute: true,
      }
    })
    if (!existing) throw new BadRequestException('Vehicle not found');

    return existing;
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto) {
    const existing = await this.findOne(id);

    const driver = updateVehicleDto.staffId
      ? await this.staffsService.findOne(updateVehicleDto.staffId)
      : null;
    if (driver && driver.type !== EStaff.DRIVER) throw new BadRequestException('Staff is not a driver');

    // evaluate route
    const transportRoute = updateVehicleDto.transportRouteId
      ? await this.transportRoutesService.findOne(updateVehicleDto.transportRouteId)
      : null;

    Object.assign(existing, {
      ...updateVehicleDto,
      driver,
      transportRoute,
    });

    const savedVehicle = await this.vehicleRepo.save(existing);

    return this.vehicleMutationReturn(savedVehicle, 'updated');
  }

  async remove(id: string) {
    const existing = await this.findOne(id);

    return this.vehicleMutationReturn(await this.vehicleRepo.remove(existing), 'deleted');
  }

  private vehicleMutationReturn(vehicle: Vehicle, type: 'created' | 'updated' | 'deleted') {
    return {
      message: type === 'created' ? 'Vehicle created successfully' : type === 'deleted' ? 'Vehicle deleted successfully' : 'Vehicle updated successfully',
      vehicle: {
        id: vehicle.id,
        vehicleNumber: vehicle.vehicleNumber,
      }
    }
  }
}
