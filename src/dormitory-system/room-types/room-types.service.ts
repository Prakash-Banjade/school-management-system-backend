import { ConflictException, Injectable } from '@nestjs/common';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RoomType } from './entities/room-type.entity';
import { Brackets, Repository } from 'typeorm';
import { QueryDto } from 'src/common/dto/query.dto';
import paginatedData from 'src/utils/paginatedData';

@Injectable()
export class RoomTypesService {
  constructor(
    @InjectRepository(RoomType) private readonly roomTypeRepo: Repository<RoomType>,
  ) { }

  async create(createRoomTypeDto: CreateRoomTypeDto) {
    const existingWitSameName = await this.roomTypeRepo.findOne({
      where: { name: createRoomTypeDto.name },
    })
    if (existingWitSameName) throw new ConflictException('Room type with same name already exists')

    const newRoomType = this.roomTypeRepo.create(createRoomTypeDto)
    const savedRoomType = await this.roomTypeRepo.save(newRoomType)

    return {
      message: 'Room type created successfully',
      roomType: {
        id: savedRoomType.id,
        name: savedRoomType.name,
      }
    }
  }

  async findAll(queryDto: QueryDto) {
    const queryBuilder = this.roomTypeRepo.createQueryBuilder('roomType');

    queryBuilder
      .orderBy("roomType.createdAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .where(new Brackets(qb => {
        queryDto.search && qb.andWhere("LOWER(roomType.name) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
      }))

    return paginatedData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const existing = await this.roomTypeRepo.findOne({
      where: { id },
    })

    if (!existing) throw new ConflictException('Room type not found')

    return existing
  }

  async update(id: string, updateRoomTypeDto: UpdateRoomTypeDto) {
    const existing = await this.findOne(id);

    // check if name is taken
    if (updateRoomTypeDto.name && updateRoomTypeDto.name !== existing.name) {
      const existingWithName = await this.roomTypeRepo.findOneBy({ name: updateRoomTypeDto.name });
      if (existingWithName) throw new ConflictException('Room type with same name already exists');
    }

    // update the room type
    Object.assign(existing, updateRoomTypeDto);
    const savedRoomType = await this.roomTypeRepo.save(existing);

    return {
      message: 'Room type updated',
      roomType: {
        id: savedRoomType.id,
        name: savedRoomType.name,
      }
    }
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    const removedRoomType = await this.roomTypeRepo.remove(existing);

    return {
      message: 'Room type removed',
      roomType: {
        id: removedRoomType.id,
        name: removedRoomType.name,
      }
    }

  }
}
