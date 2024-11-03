import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CreateDormitoryRoomDto } from './dto/create-dormitory-room.dto';
import { UpdateDormitoryRoomDto } from './dto/update-dormitory-room.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DormitoryRoom } from './entities/dormitory-room.entity';
import { Brackets, Repository } from 'typeorm';
import { DormitoriesService } from '../dormitories/dormitories.service';
import { RoomTypesService } from '../room-types/room-types.service';
import { QueryDto } from 'src/common/dto/query.dto';
import paginatedData from 'src/utils/paginatedData';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { dormitoryRoomSelectCols } from './helpers/dormitory-select-cols.config';

@Injectable()
export class DormitoryRoomsService {
  constructor(
    @InjectRepository(DormitoryRoom) private readonly dormitoryRoomRepo: Repository<DormitoryRoom>,
    private readonly dormitoriesService: DormitoriesService,
    private readonly doomTypesService: RoomTypesService,
  ) { }

  async create(createDormitoryRoomDto: CreateDormitoryRoomDto) {
    const existingDormitoryRoom = await this.dormitoryRoomRepo.findOne({
      where: {
        roomNumber: createDormitoryRoomDto.roomNumber
      }
    })

    if (existingDormitoryRoom) throw new ConflictException('Room number already exists')
    
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
      .skip(queryDto.skipPagination ? undefined : queryDto.skip)
      .take(queryDto.skipPagination ? undefined : queryDto.take)
      .leftJoin("dormitoryRoom.roomType", "roomType")
      .leftJoin("dormitoryRoom.dormitory", "dormitory")
      .leftJoin("dormitoryRoom.students", "students")
      .leftJoin("students.classRoom", "classRoom")
      .leftJoin("classRoom.parent", "parent")
      .leftJoin("students.profileImage", "profileImage")
      .where(new Brackets(qb => {

      }))

    applySelectColumns(querybuilder, dormitoryRoomSelectCols, 'dormitoryRoom')

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
      },
      select: dormitoryRoomSelectCols
    });

    if (!existingDormitoryRoom) throw new BadRequestException('Dormitory Room not found')

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
