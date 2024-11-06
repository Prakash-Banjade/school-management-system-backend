import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { TransportRoute } from './entities/transport-route.entity';
import { CreateTransportRouteDto } from './dto/create-transport-route.dto';
import { UpdateTransportRouteDto } from './dto/update-transport-route.dto';
import { QueryDto } from 'src/common/dto/query.dto';
import paginatedData from 'src/utils/paginatedData';

@Injectable()
export class TransportRoutesService {
  constructor(
    @InjectRepository(TransportRoute) private readonly transportRouteRepo: Repository<TransportRoute>,
  ) { }

  async create(createTransportRouteDto: CreateTransportRouteDto) {
    const existingWitSameName = await this.transportRouteRepo.findOne({
      where: { name: createTransportRouteDto.name },
    })
    if (existingWitSameName) throw new ConflictException('Room type with same name already exists')

    const newTransportRoute = this.transportRouteRepo.create(createTransportRouteDto)
    const savedTransportRoute = await this.transportRouteRepo.save(newTransportRoute)

    return {
      message: 'Room type created successfully',
      transportRoute: {
        id: savedTransportRoute.id,
        name: savedTransportRoute.name,
      }
    }
  }

  async findAll(queryDto: QueryDto) {
    const queryBuilder = this.transportRouteRepo.createQueryBuilder('transportRoute');

    queryBuilder
      .orderBy("transportRoute.createdAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .where(new Brackets(qb => {
        queryDto.search && qb.andWhere("LOWER(transportRoute.name) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
      }))

    return paginatedData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const existing = await this.transportRouteRepo.findOne({
      where: { id },
    })

    if (!existing) throw new ConflictException('Room type not found')

    return existing
  }

  async update(id: string, updateTransportRouteDto: UpdateTransportRouteDto) {
    const existing = await this.findOne(id);

    // check if name is taken
    if (updateTransportRouteDto.name && updateTransportRouteDto.name !== existing.name) {
      const existingWithName = await this.transportRouteRepo.findOneBy({ name: updateTransportRouteDto.name });
      if (existingWithName) throw new ConflictException('Room type with same name already exists');
    }

    // update the room type
    Object.assign(existing, updateTransportRouteDto);
    const savedTransportRoute = await this.transportRouteRepo.save(existing);

    return {
      message: 'Room type updated',
      transportRoute: {
        id: savedTransportRoute.id,
        name: savedTransportRoute.name,
      }
    }
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    const removedTransportRoute = await this.transportRouteRepo.remove(existing);

    return {
      message: 'Room type removed',
      transportRoute: {
        id: removedTransportRoute.id,
        name: removedTransportRoute.name,
      }
    }

  }
}
