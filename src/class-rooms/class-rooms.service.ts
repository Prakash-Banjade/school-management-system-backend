import { ConflictException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateClassRoomDto } from './dto/create-class-room.dto';
import { UpdateClassRoomDto } from './dto/update-class-room.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { ClassRoom } from './entities/class-room.entity';
import { REQUEST } from '@nestjs/core';
import { ClassRoomQueryDto } from './dto/classRoom-query.dto';
import { BaseRepository } from 'src/common/repository/base-repository';
import { FastifyRequest } from 'fastify';
import { EClassType, Gender } from 'src/common/types/global.type';
import { PageMetaDto } from 'src/common/dto/pageMeta.dto';
import { PageDto } from 'src/common/dto/page.dto.';

@Injectable({ scope: Scope.REQUEST })
export class ClassRoomsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    @InjectRepository(ClassRoom) private classRoomRepo: Repository<ClassRoom>,
  ) {
    super(dataSource, req);
  }

  async create(createClassRoomDto: CreateClassRoomDto) {
    const existingWithSameName = await this.classRoomRepo.findOneBy({ name: createClassRoomDto.name });
    if (existingWithSameName) throw new ConflictException('Class room with same name already exists');

    // evaluate parent class
    const parentClass = createClassRoomDto.parentClassId ? await this.getRepository(ClassRoom).findOneBy({ id: createClassRoomDto.parentClassId }) : null;

    const newClassRoom = this.classRoomRepo.create({
      ...createClassRoomDto,
      parent: parentClass,
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
    const queryBuilder = this.classRoomRepo.createQueryBuilder('classRoom');
    // const deletedAt = queryDto.deleted === Deleted.ONLY ? Not(IsNull()) : queryDto.deleted === Deleted.NONE ? IsNull() : Or(IsNull(), Not(IsNull()));

    queryBuilder
      .orderBy("classRoom.createdAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .withDeleted()
      .leftJoin("classRoom.parent", "classRoomParentClass")
      .leftJoin("classRoom.children", "childrenClasses")
      .leftJoin("classRoom.students", "students")
      .leftJoin("childrenClasses.students", "childrenStudents")
      .addSelect([
        "COUNT(DISTINCT students.id) AS totalStudentsCount",
        `COUNT(DISTINCT CASE WHEN students.gender = '${Gender.MALE}' THEN students.id END) AS totalMaleStudentsCount`,
        `COUNT(DISTINCT CASE WHEN students.gender = '${Gender.FEMALE}' THEN students.id END) AS totalFemaleStudentsCount`,
        "COUNT(DISTINCT childrenStudents.id) AS totalChildrenStudentsCount",
        `COUNT(DISTINCT CASE WHEN childrenStudents.gender = '${Gender.MALE}' THEN childrenStudents.id END) AS totalChildrenMaleStudentsCount`,
        `COUNT(DISTINCT CASE WHEN childrenStudents.gender = '${Gender.FEMALE}' THEN childrenStudents.id END) AS totalChildrenFemaleStudentsCount`
      ])
      .groupBy('classRoom.id')  // Ensure group by to aggregate counts per classRoom
      .andWhere(new Brackets(qb => {
        queryDto.search && qb.andWhere('LOWER(classRoom.name) LIKE LOWER(:search)', { search: queryDto.search });
        qb.where("classRoom.classType = :type", { type: EClassType.PRIMARY })
      }));

    const itemCount = await queryBuilder.getCount();
    const { entities, raw } = await queryBuilder.getRawAndEntities();

    // Add student counts to each entity
    entities?.map((entity, index) => {
      const entityWithCounts = Object.assign(entity, {
        totalStudentsCount: +raw[index].totalStudentsCount + +raw[index].totalChildrenStudentsCount,
        totalFemalesStudentsCount: +raw[index].totalFemaleStudentsCount + +raw[index].totalChildrenFemaleStudentsCount,
        totalMalesStudentsCount: +raw[index].totalMaleStudentsCount + +raw[index].totalChildrenMaleStudentsCount,
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
      }
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
