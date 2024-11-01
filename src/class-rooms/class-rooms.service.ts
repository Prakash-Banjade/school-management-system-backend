import { ConflictException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateClassRoomDto } from './dto/create-class-room.dto';
import { UpdateClassRoomDto } from './dto/update-class-room.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ClassRoom } from './entities/class-room.entity';
import { REQUEST } from '@nestjs/core';
import { ClassRoomQueryDto } from './dto/classRoom-query.dto';
import { BaseRepository } from 'src/common/repository/base-repository';
import { FastifyRequest } from 'fastify';
import { EClassType, Gender } from 'src/common/types/global.type';
import { PageMetaDto } from 'src/common/dto/pageMeta.dto';
import { PageDto } from 'src/common/dto/page.dto.';
import { ClassRoomsHelper } from './helpers/class-rooms.helper';
import { TeachersService } from 'src/teachers/teachers.service';
import { classRoomColumnsConfig } from './helpers/class-room-select-cols.config';

@Injectable({ scope: Scope.REQUEST })
export class ClassRoomsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    @InjectRepository(ClassRoom) private classRoomRepo: Repository<ClassRoom>,
    private readonly classRoomsHelper: ClassRoomsHelper,
    private readonly teachersService: TeachersService,
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

    const newClassRoom = this.classRoomRepo.create({
      ...createClassRoomDto,
      parent: parentClass,
      classTeacher,
    });

    const savedClassRoom = await this.getRepository(ClassRoom).save(newClassRoom);

    return {
      message: 'Class room created',
      classRoom: {
        id: savedClassRoom.id,
        name: savedClassRoom.name,
      }
    };
  }

  async findAll(queryDto: ClassRoomQueryDto) {
    const queryBuilder = this.classRoomsHelper.setClassRoomQuery(queryDto);

    // applySelectColumns(queryBuilder, classRoomsColumnsConfig, 'classRoom');

    const itemCount = await queryBuilder.getCount();
    const data = await queryBuilder.getRawMany();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto: queryDto });

    return new PageDto(data, pageMetaDto);
  }

  async findAllSections(queryDto: ClassRoomQueryDto) {
    const queryBuilder = this.classRoomsHelper.setSectionsQuery(queryDto);

    const itemCount = await queryBuilder.getCount();
    const { entities, raw } = await queryBuilder.getRawAndEntities();

    // Add student counts to each entity
    entities?.map((entity, index) => {
      const entityWithCounts = Object.assign(entity, {
        totalStudentsCount: +raw[index].totalStudentsCount,
        totalFemalesStudentsCount: +raw[index].totalFemaleStudentsCount,
        totalMalesStudentsCount: +raw[index].totalMaleStudentsCount,
      });
      return entityWithCounts;
    });

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto: queryDto });

    return new PageDto(entities, pageMetaDto);
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
    }
    // update the class room
    Object.assign(existing, updateClassRoomDto);
    const savedClassRoom = await this.classRoomRepo.save(existing);

    return {
      message: 'Class room updated',
      classRoom: {
        id: savedClassRoom.id,
        name: savedClassRoom.name,
      }
    }
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    await this.classRoomRepo.remove(existing);

    return {
      message: 'Class room removed',
    }
  }
}
