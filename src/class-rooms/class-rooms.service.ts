import { ConflictException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateClassRoomDto } from './dto/create-class-room.dto';
import { UpdateClassRoomDto } from './dto/update-class-room.dto';
import { DataSource } from 'typeorm';
import { ClassRoom } from './entities/class-room.entity';
import { REQUEST } from '@nestjs/core';
import { BaseRepository } from 'src/common/repository/base-repository';
import { FastifyRequest } from 'fastify';
import { EClassType } from 'src/common/types/global.type';
import { classRoomColumnsConfig } from './helpers/class-room-select-cols.config';
import { FeeStructuresService } from 'src/finance-system/fee-management/fee-structures/fee-structures.service';
import { Teacher } from 'src/teachers/entities/teacher.entity';
import { UtilitiesService } from 'src/utilities/utilities.service';
import { BranchesService } from 'src/branches/branches.service';

@Injectable({ scope: Scope.REQUEST })
export class ClassRoomsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly feeStructuresService: FeeStructuresService,
    private readonly utilitiesService: UtilitiesService,
    private readonly branchesService: BranchesService,
  ) { super(dataSource, req) }

  async create(createClassRoomDto: CreateClassRoomDto) {
    const existingWithSameName = await this.getRepository(ClassRoom).findOne({
      where: {
        name: createClassRoomDto.name,
        classType: EClassType.PRIMARY,
        branch: { id: this.utilitiesService.getBranchId() }
      },
      select: { id: true }
    });
    if (existingWithSameName) throw new ConflictException('Class room with same name already exists');

    // evaluate parent class
    const parentClass = createClassRoomDto.parentClassId
      ? await this.getRepository(ClassRoom).findOne({ where: { id: createClassRoomDto.parentClassId }, select: { id: true } })
      : null;

    // evaluate teacher
    const classTeacher = createClassRoomDto.classTeacherId
      ? await this.getRepository(Teacher).findOne({ where: { id: createClassRoomDto.classTeacherId }, select: { id: true } })
      : null;

    // add mandatory charge heads structure for the class
    const feeStructures = await this.feeStructuresService.createMandatoryFeeStructures({
      admissionFee: createClassRoomDto.admissionFee,
      monthlyFee: createClassRoomDto.monthlyFee,
    });

    const newClassRoom = this.getRepository(ClassRoom).create({
      ...createClassRoomDto,
      parent: parentClass,
      classTeacher,
      feeStructures,
      branch: await this.branchesService.getBranch(this.utilitiesService.getBranchId()),
    });

    const savedClass = await this.getRepository(ClassRoom).save(newClassRoom);

    return {
      message: savedClass.classType === EClassType.SECTION ? 'Class section created' : 'Class room created',
    };
  }

  async findOne(id: string) {
    const existing = await this.getRepository(ClassRoom).findOne({
      where: {
        id,
        branch: { id: this.utilitiesService.getBranchId() }
      },
      relations: {
        parent: true,
        children: true,
        classTeacher: true,
      },
      select: classRoomColumnsConfig,
    });

    if (!existing) throw new NotFoundException('Class room not found');

    return existing;
  }

  async update(id: string, updateClassRoomDto: UpdateClassRoomDto) {
    const existing = await this.findOne(id);

    // check if the class room with the given name already exists
    if (updateClassRoomDto.name && updateClassRoomDto.name !== existing.name) {
      const existingWithName = await this.getRepository(ClassRoom).findOne({ where: { name: updateClassRoomDto.name }, select: { id: true } });
      if (existingWithName) throw new ConflictException('Class room with same name already exists');
    }

    if (updateClassRoomDto.classTeacherId && (updateClassRoomDto.classTeacherId !== existing.classTeacher?.id || !updateClassRoomDto.classTeacherId)) {
      const newClassTeacher = await this.getRepository(Teacher).findOne({ where: { id: updateClassRoomDto.classTeacherId }, select: { id: true } });
      existing.classTeacher = newClassTeacher;
    } else if (updateClassRoomDto.classTeacherId === null) {
      existing.classTeacher = null;
    }

    // update the class room
    Object.assign(existing, updateClassRoomDto);
    const savedClassRoom = await this.getRepository(ClassRoom).save(existing);

    return {
      message: savedClassRoom.classType === EClassType.SECTION ? 'Class section updated' : 'Class room updated',
    }
  }

  async createFeeStructures() {
    const classRooms = await this.getRepository(ClassRoom).find({
      where: { classType: EClassType.PRIMARY },
      select: { id: true, admissionFee: true, monthlyFee: true }
    });

    await Promise.all(classRooms.map(async classRoom => {
      const feeStructures = await this.feeStructuresService.createMandatoryFeeStructures({
        admissionFee: classRoom.admissionFee,
        monthlyFee: classRoom.monthlyFee,
      });

      classRoom.feeStructures = feeStructures;
      await this.getRepository(ClassRoom).save(classRoom);
    }))
  }
}
