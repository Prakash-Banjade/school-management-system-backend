import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRouteStopDto } from './dto/create-route-stop.dto';
import { UpdateRouteStopDto } from './dto/update-route-stop.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RouteStop } from './entities/route-stop.entity';
import { Brackets, Repository } from 'typeorm';
import { VehiclesService } from '../vehicles/vehicles.service';
import paginatedData from 'src/utils/paginatedData';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { routeStopSelectCols } from './helpers/route-stop-select-cols';
import { RouteStopQueryDto, ERouteStopSortBy } from './dto/route-stop-query.dto';

@Injectable()
export class RouteStopsService {
  constructor(
    @InjectRepository(RouteStop) private readonly routeStopRepo: Repository<RouteStop>,
    private readonly vehiclesService: VehiclesService,
  ) { }

  async create(createRouteStopDto: CreateRouteStopDto) {
    const vehicle = await this.vehiclesService.findOne(createRouteStopDto.vehicleId);

    const newRouteStop = this.routeStopRepo.create({
      ...createRouteStopDto,
      vehicle,
    });
    await this.routeStopRepo.save(newRouteStop);

    return {
      message: 'Route stop created successfully',
    }
  }

  findAll(queryDto: RouteStopQueryDto) {
    const queryBuilder = this.routeStopRepo.createQueryBuilder('routeStop');

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
      }))

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
    return this.routeStopRepo.createQueryBuilder('routeStop')
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
      ])
      .getRawMany();
  }

  async findOne(id: string) {
    const existing = await this.routeStopRepo.findOne({
      where: { id },
      relations: ['vehicle'],
      select: routeStopSelectCols,
    })

    if (!existing) throw new NotFoundException('Route stop not found')

    return existing;
  };

  async findOneWithAvailableSeats(id: string) {
    const existing = await this.routeStopRepo.createQueryBuilder('routeStop')
      .leftJoin('routeStop.vehicle', 'vehicle')
      .leftJoin('routeStop.students', 'students')
      .where('routeStop.id = :id', { id })
      .select([
        'routeStop.id as id',
        'routeStop.name as name',
        'vehicle.capacity as capacity',
        'COUNT(students.id) as studentsCount'
      ]).getRawOne();

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
      const vehicle = await this.vehiclesService.findOne(updateRouteStopDto.vehicleId);
      existing.vehicle = vehicle;
    }

    Object.assign(existing, {
      ...updateRouteStopDto,
    });

    await this.routeStopRepo.save(existing);

    return {
      message: 'Route stop updated',
    }
  }

  async remove(id: string) {
    const existing = await this.findOne(id);

    await this.routeStopRepo.remove(existing);

    return {
      message: 'Route stop removed',
    }
  }
}
