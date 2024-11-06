import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findOne(id: string) {
    const existing = await this.routeStopRepo.findOne({
      where: { id },
      relations: ['vehicle'],
      select: routeStopSelectCols,
    })

    if (!existing) throw new NotFoundException('Route stop not found')

    return existing;
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
