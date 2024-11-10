import { BadRequestException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { Brackets, DataSource, IsNull, Not, Or } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Teacher } from './entities/teacher.entity';
import { TeacherQueryDto } from './dto/teacher-query.dto';
import { teachersColumnsConfig } from './helpers/teacher-select-cols.config';
import { BaseRepository } from 'src/common/repository/base-repository';
import { ImagesService } from 'src/file-management/images/images.service';
import { AccountsService } from 'src/auth-system/accounts/accounts.service';
import { FastifyRequest } from 'fastify';
import { Deleted } from 'src/common/dto/query.dto';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { PageMetaDto } from 'src/common/dto/pageMeta.dto';
import { PageDto } from 'src/common/dto/page.dto.';
import paginatedData from 'src/utils/paginatedData';


@Injectable({ scope: Scope.REQUEST })
export class TeachersService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly imageService: ImagesService,
    private readonly accountsService: AccountsService,
  ) {
    super(dataSource, req);
  }

  async create(createTeacherDto: CreateTeacherDto) {
    // check if teacher already exists
    await this.checkIfTeacherExists(createTeacherDto);

    const profileImage = createTeacherDto.profileImageId
      ? await this.imageService.findOne(createTeacherDto.profileImageId)
      : null;

    const teacher = this.getRepository(Teacher).create({
      ...createTeacherDto,
      profileImage
    });
    const savedTeacher = await this.getRepository(Teacher).save(teacher);

    // create account
    await this.accountsService.createAccount(savedTeacher);

    return this.teacherMutationReturn(savedTeacher, 'created');
  }

  async findAll(queryDto: TeacherQueryDto) {
    const queryBuilder = this.getRepository(Teacher).createQueryBuilder('teacher');

    queryBuilder
      .orderBy("teacher.createdAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .leftJoin("teacher.profileImage", "profileImage")
      .leftJoin('teacher.account', 'account')
      .andWhere(new Brackets(qb => {
        queryDto.search && qb.andWhere(new Brackets(qb => {
          qb.orWhere("LOWER(CONCAT(teacher.firstName, ' ', teacher.lastName)) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
          qb.orWhere("LOWER(teacher.email) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
        }))

        queryDto.teacherId && qb.andWhere('teacher.teacherId = :teacherId', { teacherId: queryDto.teacherId });
      }));

    applySelectColumns(queryBuilder, teachersColumnsConfig, 'teacher');

    return paginatedData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const existingTeacher = await this.getRepository(Teacher).findOne({
      where: { id },
      relations: {
        profileImage: true,
        account: true,
      },
      select: {
        profileImage: {
          id: true,
          url: true,
          originalName: true,
        },
        account: {
          id: true,
        }
      }
    });
    if (!existingTeacher) throw new NotFoundException('Teacher not found');

    return existingTeacher;
  }

  async update(id: string, updateTeacherDto: UpdateTeacherDto) {
    const existingTeacher = await this.findOne(id);

    // check if teacher already exists
    await this.checkIfTeacherExists(updateTeacherDto, existingTeacher);

    // evaluate profile image
    if (existingTeacher.profileImage?.id && updateTeacherDto.profileImageId !== undefined) {
      await this.imageService.update(existingTeacher.profileImage.id, updateTeacherDto.profileImageId);
    } else if (updateTeacherDto.profileImageId !== undefined) { // this will execute only when teacher has no profile image before
      existingTeacher.profileImage = await this.imageService.findOne(updateTeacherDto.profileImageId); // setting new profile image
    }

    Object.assign(existingTeacher, {
      ...updateTeacherDto,
    });
    const savedTeacher = await this.getRepository(Teacher).save(existingTeacher);

    return this.teacherMutationReturn(savedTeacher, 'updated');
  }

  async remove(id: string) {
    const existingTeacher = await this.findOne(id);

    return this.getRepository(Teacher).remove(existingTeacher);
  }

  async checkIfTeacherExists(teacherDto: CreateTeacherDto | UpdateTeacherDto, teacher?: Teacher) {
    const { teacherId, email, phone, accountNumber } = teacherDto;

    const existingTeacher = await this.getRepository(Teacher).createQueryBuilder('teacher')
      .where(new Brackets(qb => {
        qb.where([
          { teacherId },
          { email },
          { phone },
          { accountNumber }
        ])
        teacher?.id && qb.andWhere({ id: Not(teacher.id) })
      })).getOne();

    if (existingTeacher && !teacher) {
      if (existingTeacher.teacherId === teacherId) throw new BadRequestException('Teacher with this teacherId already exists');
      if (existingTeacher.email === email) throw new BadRequestException('Teacher with this email already exists');
      if (existingTeacher.phone === phone) throw new BadRequestException('Teacher with this phone already exists');
      if (existingTeacher.accountNumber === accountNumber) throw new BadRequestException('Teacher with this accountNumber already exists');
    } else if (existingTeacher && teacher) {
      if (existingTeacher.teacherId === teacherId && existingTeacher.id !== teacher.id) throw new BadRequestException('Teacher with this teacherId already exists');
      if (existingTeacher.email === email && existingTeacher.id !== teacher.id) throw new BadRequestException('Teacher with this email already exists');
      if (existingTeacher.phone === phone && existingTeacher.id !== teacher.id) throw new BadRequestException('Teacher with this phone already exists');
      if (existingTeacher.accountNumber === accountNumber && existingTeacher.id !== teacher.id) throw new BadRequestException('Teacher with this accountNumber already exists');
    }
  }

  private teacherMutationReturn = (teacher: Teacher, type: 'created' | 'updated') => {
    return {
      message: type === 'created' ? 'Teacher created successfully' : 'Teacher updated successfully',
      teacher: {
        id: teacher.id,
        name: `${teacher.firstName} ${teacher.lastName}`,
      }
    }
  }
}
