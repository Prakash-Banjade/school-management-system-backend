import { ConflictException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateClassRoomDto } from './dto/create-class-room.dto';
import { UpdateClassRoomDto } from './dto/update-class-room.dto';
import { DataSource, ILike } from 'typeorm';
import { ClassRoom } from './entities/class-room.entity';
import { REQUEST } from '@nestjs/core';
import { BaseRepository } from 'src/common/repository/base-repository';
import { FastifyRequest } from 'fastify';
import { AuthUser, EClassType } from 'src/common/types/global.type';
import { classRoomColumnsConfig } from './helpers/class-room-select-cols.config';
import { FeeStructuresService } from 'src/finance-system/fee-management/fee-structures/fee-structures.service';
import { Teacher } from 'src/teachers/entities/teacher.entity';
import { UtilitiesService } from 'src/utilities/utilities.service';
import { BranchesService } from 'src/branches/branches.service';
import { Faculty } from 'src/faculties/entities/faculty.entity';
import { FeeStructure } from 'src/finance-system/fee-management/fee-structures/entities/fee-structure.entity';
import { isStudent, isTeacher } from 'src/utils/utils';

@Injectable({ scope: Scope.REQUEST })
export class ClassRoomsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly feeStructuresService: FeeStructuresService,
    private readonly utilitiesService: UtilitiesService,
    private readonly branchesService: BranchesService,
  ) { super(dataSource, req) }

  async create(dto: CreateClassRoomDto) {
    await this.checkIfExisting(dto);
    // evaluate faculty
    const faculty = await this.getRepository(Faculty).findOne({ where: { id: dto.facultyId }, select: { id: true } });
    if (!faculty) throw new NotFoundException('Faculty not found');

    // evaluate teacher
    const classTeacher = dto.classTeacherId
      ? await this.getRepository(Teacher).findOne({
        where: { id: dto.classTeacherId, account: { branch: { id: this.utilitiesService.getBranchId() } } },
        select: { id: true }
      }) : null;

    // evaluate parent class
    const parentClass = dto.parentClassId
      ? await this.getRepository(ClassRoom).findOne({
        where: { id: dto.parentClassId, branch: { id: this.utilitiesService.getBranchId() } },
        relations: { branch: true, faculty: true, children: true },
        select: {
          branch: { id: true },
          faculty: { id: true },
          children: { id: true },
        }
      }) : null;

    // if section is creating first time, we need to shift everything from parent to that section, which is done below 
    if (parentClass && parentClass.children.length === 0) {
      const { id, createdAt, updatedAt, ...rest } = parentClass;

      // get mandatory charge of the parent class
      const feeStructures = await this.getRepository(FeeStructure).find({
        where: { classRoom: { id: parentClass.id } },
        select: { id: true, amount: true }
      });

      const newClassRoom = this.getRepository(ClassRoom).create({
        ...rest,
        classType: EClassType.PRIMARY,
        parent: null, // this will not have any parents
        classTeacher: null,
        feeStructures,
      });

      const savedClass = await this.getRepository(ClassRoom).save(newClassRoom);

      await this.getRepository(ClassRoom).update(
        { id: parentClass.id },
        {
          name: dto.name,
          location: dto.location,
          classType: EClassType.SECTION,
          parent: savedClass,
          classTeacher: classTeacher,
          createdAt: savedClass.createdAt,
          updatedAt: savedClass.updatedAt,
        }
      );

      return {
        message: savedClass.classType === EClassType.SECTION ? 'Class section created' : 'Class room created',
      };
    }

    // add mandatory charge heads structure for the class
    const feeStructures = await this.feeStructuresService.createMandatoryFeeStructures({
      admissionFee: dto.admissionFee,
      monthlyFee: dto.monthlyFee,
    });

    const newClassRoom = this.getRepository(ClassRoom).create({
      ...dto,
      faculty: parentClass?.faculty ?? faculty,
      parent: parentClass,
      classTeacher,
      feeStructures,
      branch: parentClass?.branch ?? await this.branchesService.getBranch(this.utilitiesService.getBranchId()),
    });

    const savedClass = await this.getRepository(ClassRoom).save(newClassRoom);

    return {
      message: savedClass.classType === EClassType.SECTION ? 'Class section created' : 'Class room created',
    };
  }

  async findOne(id: string) {
    const currentUser = this.utilitiesService.getCurrentUser();

    const existing = await this.getRepository(ClassRoom).findOne({
      where: {
        id,
        branch: { id: this.utilitiesService.getBranchId() },
        ...(isTeacher(currentUser) ? { classTeacher: { id: currentUser.teacherId } } : {}) // teacher can read only their classes
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
    if (updateClassRoomDto.name && updateClassRoomDto.name !== existing.name) await this.checkIfExisting(updateClassRoomDto);

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

  private async checkIfExisting(dto: Partial<{ name: string, classType: EClassType, facultyId: string, parentClassId: string }>) {
    const existingWithSameName = await this.getRepository(ClassRoom).findOne({
      where: {
        name: ILike(dto.name),
        classType: dto.classType,
        parent: {
          id: dto.parentClassId
        },
        branch: { id: this.utilitiesService.getBranchId() },
        faculty: { id: dto.facultyId }
      },
      select: { id: true }
    });
    if (existingWithSameName) throw new ConflictException('Class room with same name already exists');
  }

  async getMyClassInfo(currentUser: AuthUser) {
    if (!isStudent(currentUser)) return null;

    return this.getRepository(ClassRoom).findOne({
      where: {
        id: currentUser.classRoomId,
      },
      select: { id: true, fullName: true }
    });
  }
}
