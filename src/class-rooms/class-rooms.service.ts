import { ConflictException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateClassRoomDto } from './dto/create-class-room.dto';
import { UpdateClassRoomDto } from './dto/update-class-room.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ClassRoom } from './entities/class-room.entity';
import { REQUEST } from '@nestjs/core';
import { BaseRepository } from 'src/common/repository/base-repository';
import { FastifyRequest } from 'fastify';
import { EClassType } from 'src/common/types/global.type';
import { TeachersService } from 'src/teachers/teachers.service';
import { classRoomColumnsConfig } from './helpers/class-room-select-cols.config';
import { FeeStructuresService } from 'src/finance-system/fee-management/fee-structures/fee-structures.service';

@Injectable({ scope: Scope.REQUEST })
export class ClassRoomsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    @InjectRepository(ClassRoom) private classRoomRepo: Repository<ClassRoom>,
    private readonly teachersService: TeachersService,
    private readonly feeStructuresService: FeeStructuresService,
  ) {
    super(dataSource, req);
  }

  async create(createClassRoomDto: CreateClassRoomDto) {
    const existingWithSameName = await this.classRoomRepo.findOneBy({ name: createClassRoomDto.name, classType: EClassType.PRIMARY });
    if (existingWithSameName) throw new ConflictException('Class room with same name already exists');

    // evaluate parent class
    const parentClass = createClassRoomDto.parentClassId ? await this.getRepository(ClassRoom).findOneBy({ id: createClassRoomDto.parentClassId }) : null;

    // evaluate teacher
    const classTeacher = createClassRoomDto.classTeacherId ? await this.teachersService.findOne(createClassRoomDto.classTeacherId) : null;

    // add mandatory charge heads structure for the class
    const feeStructures = await this.feeStructuresService.createMandatoryFeeStructures({
      admissionFee: createClassRoomDto.admissionFee,
      monthlyFee: createClassRoomDto.monthlyFee,
    });

    const newClassRoom = this.classRoomRepo.create({
      ...createClassRoomDto,
      parent: parentClass,
      classTeacher,
      feeStructures,
    });

    const savedClass = await this.getRepository(ClassRoom).save(newClassRoom);

    return {
      message: savedClass.classType === EClassType.SECTION ? 'Class section created' : 'Class room created',
    };
  }

  async findOne(id: string) {
    const existing = await this.classRoomRepo.findOne({
      where: { id },
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
      const existingWithName = await this.classRoomRepo.findOneBy({ name: updateClassRoomDto.name });
      if (existingWithName) throw new ConflictException('Class room with same name already exists');
    }

    if (updateClassRoomDto.classTeacherId && (updateClassRoomDto.classTeacherId !== existing.classTeacher?.id || !updateClassRoomDto.classTeacherId)) {
      const newClassTeacher = await this.teachersService.findOne(updateClassRoomDto.classTeacherId);
      existing.classTeacher = newClassTeacher;
    } else if (updateClassRoomDto.classTeacherId === null) {
      existing.classTeacher = null;
    }

    // update the class room
    Object.assign(existing, updateClassRoomDto);
    const savedClassRoom = await this.classRoomRepo.save(existing);

    return {
      message: savedClassRoom.classType === EClassType.SECTION ? 'Class section updated' : 'Class room updated',
    }
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    await this.classRoomRepo.remove(existing);

    return {
      message: existing.classType === EClassType.SECTION ? 'Class section removed' : 'Class room removed',
    }
  }

  // async createFeeStructures() {
  //   const classRooms = await this.classRoomRepo.find({
  //     where: { classType: EClassType.PRIMARY },
  //     select: { id: true }
  //   });

  //   await Promise.all(classRooms.map(async classRoom => {
  //     const feeStructures = await this.feeStructuresService.createMandatoryFeeStructures({
  //       admissionFee: classRoom.admissionFee,
  //       monthlyFee: classRoom.monthlyFee,
  //     });

  //     classRoom.feeStructures = feeStructures;
  //     await this.getRepository(ClassRoom).save(classRoom);
  //   }))
  // }
}
