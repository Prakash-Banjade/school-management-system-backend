import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDormitoryRoomDto } from './dto/create-dormitory-room.dto';
import { UpdateDormitoryRoomDto } from './dto/update-dormitory-room.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DormitoryRoom } from './entities/dormitory-room.entity';
import { Repository } from 'typeorm';
import { DormitoriesService } from '../dormitories/dormitories.service';
import { RoomTypesService } from '../room-types/room-types.service';
import { QueryDto } from 'src/common/dto/query.dto';
import paginatedData from 'src/utils/paginatedData';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { dormitoryRoomSelectCols } from './helpers/dormitory-select-cols.config';
import { AuthUser } from 'src/common/types/global.type';
import { UtilitiesService } from 'src/utilities/utilities.service';
import { BranchesService } from 'src/branches/branches.service';
import { isStudent } from 'src/utils/utils';

@Injectable()
export class DormitoryRoomsService {
  constructor(
    @InjectRepository(DormitoryRoom) private readonly dormitoryRoomRepo: Repository<DormitoryRoom>,
    private readonly dormitoriesService: DormitoriesService,
    private readonly doomTypesService: RoomTypesService,
    private readonly utilitiesService: UtilitiesService,
    private readonly branchesService: BranchesService,
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
      branch: await this.branchesService.getBranch(this.utilitiesService.getBranchId())
    });

    await this.dormitoryRoomRepo.save(dormitoryRoom)

    return { message: 'Dormitory room created' }
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

    applySelectColumns(querybuilder, dormitoryRoomSelectCols, 'dormitoryRoom')
    this.utilitiesService.applyBranchFilter(querybuilder, 'dormitoryRoom.branchId = :branchId');

    return paginatedData(queryDto, querybuilder)
  }

  getOptions(queryDto: QueryDto) {
    const queryBuilder = this.dormitoryRoomRepo.createQueryBuilder('dormitoryRoom')
      .limit(queryDto.take)
      .offset(queryDto.skip)
      .select([
        'dormitoryRoom.id as value',
        'dormitoryRoom.roomNumber as label',
      ]);

    this.utilitiesService.applyBranchFilter(queryBuilder, 'dormitoryRoom.branchId = :branchId');

    return queryBuilder.getRawMany();
  }

  async getStudentDormitory(currentUser: AuthUser) {
    if (!isStudent(currentUser)) throw new ForbiddenException();

    const dormitoryRoom = await this.dormitoryRoomRepo.createQueryBuilder('dormitoryRoom')
      .leftJoin('dormitoryRoom.students', 'students')
      .where('students.id = :id', { id: currentUser.studentId })
      .select('dormitoryRoom.id')
      .getOne();

    if (!dormitoryRoom) throw new NotFoundException('Dormitory room not found');

    const roomDetail = await this.dormitoryRoomRepo.createQueryBuilder('dormitoryRoom')
      .where('dormitoryRoom.id = :id', { id: dormitoryRoom.id })
      .leftJoin('dormitoryRoom.students', 'students', 'students.id != :studentId', { studentId: currentUser.studentId })
      .leftJoin('students.classRoom', 'classRoom')
      .leftJoin('classRoom.parent', 'parent')
      .leftJoin('dormitoryRoom.dormitory', 'dormitory')
      .leftJoin('dormitoryRoom.roomType', 'roomType')
      .select([
        'dormitoryRoom.id as id',
        'dormitoryRoom.roomNumber as roomNumber',
        'dormitoryRoom.costPerBed as costPerBed',
        'dormitoryRoom.noOfBeds as noOfBeds',
        'dormitory.name as dormitoryName',
        'roomType.name as roomTypeName',
        `
          CASE WHEN students.id IS NOT NULL THEN
            JSON_ARRAYAGG(JSON_OBJECT("id", students.id, "name", CONCAT(students.firstName, " ", students.lastName), "classroomName", CASE WHEN parent.id IS NULL THEN classRoom.name ELSE CONCAT(parent.name, \' - \', classRoom.name) END))
          ELSE
            NULL
          END as roomMates
        `
      ])
      .groupBy('students.id')
      .getRawOne();

    return {
      ...roomDetail,
      roomMates: typeof roomDetail.roomMates === 'string' ? JSON.parse(roomDetail.roomMates) : roomDetail.roomMates,
    };
  }

  async findOne(id: string) {
    const existingDormitoryRoom = await this.dormitoryRoomRepo.findOne({
      where: {
        id,
        branch: { id: this.utilitiesService.getBranchId() }
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

  async findOneWithAvailableBed(id: string) {
    const queryBuilder = this.dormitoryRoomRepo.createQueryBuilder('dormitoryRoom')
      .leftJoin('dormitoryRoom.students', 'students')
      .where('dormitoryRoom.id = :id', { id })
      .select([
        'dormitoryRoom.id as id',
        'dormitoryRoom.roomNumber as roomNumber',
        'dormitoryRoom.noOfBeds as noOfBeds',
        'COUNT(DISTINCT students.id) as studentsCount'
      ]);

    this.utilitiesService.applyBranchFilter(queryBuilder, 'dormitoryRoom.branchId = :branchId');

    const existing = await queryBuilder.getRawOne();

    if (!existing) throw new NotFoundException('Dormitory room not found');

    if (existing.noOfBeds <= +existing.studentsCount) throw new BadRequestException('No available beds in room number ' + existing.roomNumber);

    return {
      id: existing.id,
      roomNumber: existing.roomNumber,
      noOfBeds: existing.noOfBeds,
    } as DormitoryRoom;
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

    await this.dormitoryRoomRepo.save(updatedDormitoryRoom)

    return { message: 'Dormitory room updated' }
  }

  async remove(id: string) {
    await this.dormitoryRoomRepo.delete({ id });

    return { message: 'Dormitory room deleted' }
  }
}
