import { Injectable } from '@nestjs/common';
import { CreateDormitoryRoomDto } from './dto/create-dormitory-room.dto';
import { UpdateDormitoryRoomDto } from './dto/update-dormitory-room.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DormitoryRoom } from './entities/dormitory-room.entity';
import { Brackets, Repository } from 'typeorm';
import { DormitoriesService } from '../dormitories/dormitories.service';
import { RoomTypesService } from '../room-types/room-types.service';
import { QueryDto } from 'src/common/dto/query.dto';
import paginatedData from 'src/utils/paginatedData';

@Injectable()
export class DormitoryRoomsService {
  constructor(
    @InjectRepository(DormitoryRoom) private readonly dormitoryRoomRepo: Repository<DormitoryRoom>,
    private readonly dormitoriesService: DormitoriesService,
    private readonly doomTypesService: RoomTypesService,
  ) { }

  async create(createDormitoryRoomDto: CreateDormitoryRoomDto) {
    const dormitory = await this.dormitoriesService.findOne(createDormitoryRoomDto.dormitoryId)
    const roomType = await this.doomTypesService.findOne(createDormitoryRoomDto.roomTypeId)

    const dormitoryRoom = this.dormitoryRoomRepo.create({
      ...createDormitoryRoomDto,
      dormitory,
      roomType,
    });

    return this.dormitoryMutationReturn(await this.dormitoryRoomRepo.save(dormitoryRoom), 'created');
  }

  async findAll(queryDto: QueryDto) {
    const querybuilder = this.dormitoryRoomRepo.createQueryBuilder('dormitoryRoom')

    querybuilder
      .orderBy('dormitoryRoom.createdAt', 'DESC')
      .skip(queryDto.skip)
      .take(queryDto.take)
      .where(new Brackets(qb => {

      }))

    return paginatedData(queryDto, querybuilder)
  }

  async findOne(id: string) {
    const existingDormitoryRoom = await this.dormitoryRoomRepo.findOne({
      where: {
        id
      },
      relations: {
        dormitory: true,
        roomType: true,
      }
    });

    if (!existingDormitoryRoom) throw new Error('Dormitory Room not found')

    return existingDormitoryRoom
  }

  async update(id: string, updateDormitoryRoomDto: UpdateDormitoryRoomDto) {
    const existingDormitoryRoom = await this.findOne(id);

    const dormitory = (updateDormitoryRoomDto.dormitoryId && updateDormitoryRoomDto.dormitoryId !== existingDormitoryRoom.dormitory?.id)
      ? await this.dormitoriesService.findOne(updateDormitoryRoomDto.dormitoryId)
      : existingDormitoryRoom.dormitory;

    const roomType = (updateDormitoryRoomDto.roomTypeId && updateDormitoryRoomDto.roomTypeId !== existingDormitoryRoom.roomType?.id)
      ? await this.doomTypesService.findOne(updateDormitoryRoomDto.roomTypeId)
      : existingDormitoryRoom.roomType;

    const updatedDormitoryRoom = this.dormitoryRoomRepo.merge(existingDormitoryRoom, {
      ...updateDormitoryRoomDto,
      dormitory,
      roomType
    });

    return this.dormitoryMutationReturn(await this.dormitoryRoomRepo.save(updatedDormitoryRoom), 'updated');
  }

  async remove(id: string) {
    const existingDormitoryRoom = await this.findOne(id);

    const deletedDormitoryRoom = await this.dormitoryRoomRepo.remove(existingDormitoryRoom);

    return this.dormitoryMutationReturn(deletedDormitoryRoom, 'deleted');
  }

  private dormitoryMutationReturn(dormitoryRoom: DormitoryRoom, type: 'created' | 'updated' | 'deleted') {
    return {
      message: type === 'created' ? 'Dormitory Room created successfully' : type === 'deleted' ? 'Dormitory Room deleted successfully' : 'Dormitory Room updated successfully',
      dormitoryRoom: {
        id: dormitoryRoom.id,
        roomNumber: dormitoryRoom.roomNumber,
        costPerBed: dormitoryRoom.costPerBed,
        noOfBeds: dormitoryRoom.noOfBeds,
      }
    }
  }
}
