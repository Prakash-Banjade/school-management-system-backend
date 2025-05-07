import { BadRequestException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { Brackets, DataSource, In, Not } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Teacher } from './entities/teacher.entity';
import { TeacherQueryDto } from './dto/teacher-query.dto';
import { teachersColumnsConfig } from './helpers/teacher-select-cols.config';
import { BaseRepository } from 'src/common/repository/base-repository';
import { ImagesService } from 'src/file-management/images/images.service';
import { AccountsService } from 'src/auth-system/accounts/accounts.service';
import { FastifyRequest } from 'fastify';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import paginatedData from 'src/utils/paginatedData';
import { SalaryStructure } from 'src/finance-system/salary-management/salary-structures/entities/salary-structure.entity';
import { UtilitiesService } from 'src/utilities/utilities.service';
import { Faculty } from 'src/faculties/entities/faculty.entity';
import { UpdateAccountDto } from 'src/auth-system/accounts/dto/update-account.dto';
import { TeacherUtilsService } from './helpers/teacher-utils.service';

@Injectable({ scope: Scope.REQUEST })
export class TeachersService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly imageService: ImagesService,
    private readonly accountsService: AccountsService,
    private readonly utilitiesService: UtilitiesService,
    private readonly teacherUtilsService: TeacherUtilsService
  ) { super(dataSource, req) }

  async create(createTeacherDto: CreateTeacherDto) {
    // check if teacher already exists
    await this.checkIfTeacherExists(createTeacherDto);

    const profileImage = createTeacherDto.profileImageId
      ? await this.imageService.findOne(createTeacherDto.profileImageId)
      : null;

    const faculties = createTeacherDto.facultyIds?.length ? await this.getRepository(Faculty).find({
      where: { id: In(createTeacherDto.facultyIds) },
      select: { id: true }
    }) : [];

    const teacher = this.getRepository(Teacher).create({
      ...createTeacherDto,
      teacherId: await this.teacherUtilsService.generateTeacherId(),
      faculties,
      salaryStructure: this.getRepository(SalaryStructure).create({
        basicSalary: createTeacherDto.basicSalary,
        allowances: createTeacherDto.allowances ?? [],
      })
    });

    const savedTeacher = await this.getRepository(Teacher).save(teacher);

    // create account
    await this.accountsService.createAccount(savedTeacher, profileImage);

    return { message: 'Teacher created' }
  }

  async findAll(queryDto: TeacherQueryDto) {
    const queryBuilder = this.getRepository(Teacher).createQueryBuilder('teacher');

    queryBuilder
      .orderBy("teacher.createdAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .leftJoin('teacher.account', 'account')
      .leftJoin("account.profileImage", "profileImage")
      .leftJoin('teacher.faculties', 'faculties')
      .andWhere(new Brackets(qb => {
        queryDto.search && qb.andWhere(new Brackets(qb => {
          qb.orWhere("account.lowerCasedFullName LIKE LOWER(:search)", { search: `${queryDto.search}%` })
            .orWhere("teacher.teacherId = :exactSearch", { exactSearch: queryDto.search })
        }))
        queryDto.departmentIds?.length && qb.andWhere('faculties.id IN (:...departmentIds)', { departmentIds: queryDto.departmentIds })
      }));

    applySelectColumns(queryBuilder, teachersColumnsConfig, 'teacher');
    this.utilitiesService.applyBranchFilter(queryBuilder);

    return paginatedData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const existingTeacher = await this.getRepository(Teacher).findOne({
      where: {
        id,
        account: { branch: { id: this.utilitiesService.getBranchId() } }
      },
      relations: {
        faculties: true,
        account: { profileImage: true },
      },
      select: {
        account: {
          id: true,
          profileImage: {
            id: true,
            url: true,
          },
        },
        faculties: {
          id: true,
          name: true,
        }
      }
    });
    if (!existingTeacher) throw new NotFoundException('Teacher not found');

    return existingTeacher;
  }

  async findLibraryTeacher(teacherId: string) {
    const queryBuilder = this.getRepository(Teacher).createQueryBuilder('teacher')
      .leftJoin("teacher.bookTransactions", "bookTransactions")
      .leftJoin("teacher.account", "account")
      .leftJoin("account.profileImage", "profileImage")
      .leftJoin("teacher.faculties", "faculties")
      .where("teacher.teacherId = :teacherId", { teacherId })
      .select([
        "teacher.id AS id",
        "account.lowerCasedFullName AS name",
        "teacher.phone AS phone",
        "teacher.email AS email",
        "profileImage.url AS profileImageUrl",
        "COUNT(bookTransactions.id) AS transactionCount",
        "JSON_ARRAYAGG(faculties.name) AS faculties"
      ])
      .groupBy('teacher.id')
    this.utilitiesService.applyBranchFilter(queryBuilder);

    const teacher = await queryBuilder.getRawOne();

    if (!teacher) throw new NotFoundException('Teacher not found');

    return teacher;
  }

  async update(id: string, updateTeacherDto: UpdateTeacherDto) {
    const existingTeacher = await this.findOne(id);

    // check if teacher already exists
    await this.checkIfTeacherExists(updateTeacherDto, existingTeacher);

    const faculties = updateTeacherDto.facultyIds?.length ? await this.getRepository(Faculty).find({
      where: { id: In(updateTeacherDto.facultyIds) },
      select: { id: true }
    }) : [];

    // update account related details
    await this.accountsService.update(existingTeacher.account?.id, updateTeacherDto as UpdateAccountDto)

    Object.assign(existingTeacher, {
      ...updateTeacherDto,
      faculties,
    });
    await this.getRepository(Teacher).save(existingTeacher);

    return { message: 'Teacher updated' };
  }

  async checkIfTeacherExists(teacherDto: CreateTeacherDto | UpdateTeacherDto, teacher?: Teacher) {
    const { email, phone, accountNumber } = teacherDto;

    const existingTeacher = await this.getRepository(Teacher).createQueryBuilder('teacher')
      .where(new Brackets(qb => {
        qb.where([
          { email },
          { phone },
          { accountNumber }
        ])
        teacher?.id && qb.andWhere({ id: Not(teacher.id) })
      })).getOne();

    if (existingTeacher && !teacher) {
      if (existingTeacher.email === email) throw new BadRequestException('Teacher with this email already exists');
      if (existingTeacher.phone === phone) throw new BadRequestException('Teacher with this phone already exists');
      if (existingTeacher.accountNumber === accountNumber) throw new BadRequestException('Teacher with this accountNumber already exists');
    } else if (existingTeacher && teacher) {
      if (existingTeacher.email === email && existingTeacher.id !== teacher.id) throw new BadRequestException('Teacher with this email already exists');
      if (existingTeacher.phone === phone && existingTeacher.id !== teacher.id) throw new BadRequestException('Teacher with this phone already exists');
      if (existingTeacher.accountNumber === accountNumber && existingTeacher.id !== teacher.id) throw new BadRequestException('Teacher with this accountNumber already exists');
    }
  }
}
