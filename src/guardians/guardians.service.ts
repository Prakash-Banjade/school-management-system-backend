import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Guardian } from './entities/guardian.entity';
import { Brackets, DataSource, IsNull, Not, Or, Repository } from 'typeorm';
import { Student } from 'src/students/entities/student.entity';
import { GuardianOmitStudentId } from 'src/students/dto/create-student.dto';
import { REQUEST } from '@nestjs/core';
import { BaseRepository } from 'src/common/repository/base-repository';
import { ImagesService } from 'src/file-management/images/images.service';
import { FastifyRequest } from 'fastify';
import { Deleted, QueryDto } from 'src/common/dto/query.dto';
import paginatedData from 'src/utils/paginatedData';

@Injectable({ scope: Scope.REQUEST })
export class GuardiansService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    @InjectRepository(Guardian) private readonly guardiansRepo: Repository<Guardian>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    private readonly imagesService: ImagesService
  ) {
    super(dataSource, req);
  }

  async create(createGuardianDto: CreateGuardianDto) {
    const student = await this.studentRepo.findOneBy({ id: createGuardianDto.studentId });
    const profileImage = createGuardianDto.profileImageId ? await this.imagesService.findOne(createGuardianDto.profileImageId) : null;

    const newGuardian = this.guardiansRepo.create({
      ...createGuardianDto,
      students: [student],
      profileImage
    });

    const savedGuardian = await this.getRepository<Guardian>(Guardian).save(newGuardian);

    return this.guardianMutationReturn(savedGuardian, 'created');
  }

  async createGuardiansByStudent(guardians: GuardianOmitStudentId[], student: Student) {
    let newGuardians: Guardian[] = [];

    for (const guardian of guardians) {
      const profileImage = guardian.profileImageId ? await this.imagesService.findOne(guardian.profileImageId) : null;
      const newGuardian = this.guardiansRepo.create({
        ...guardian,
        students: [student],
        profileImage
      });
      newGuardians.push(newGuardian);
    }

    await this.guardiansRepo.save(newGuardians);

    return {
      message: 'Guardians created successfully',
      status: 'success'
    }
  }

  async findAll(queryDto: QueryDto) {
    const queryBuilder = this.guardiansRepo.createQueryBuilder('guardian');
    const deletedAt = queryDto.deleted === Deleted.ONLY ? Not(IsNull()) : queryDto.deleted === Deleted.NONE ? IsNull() : Or(IsNull(), Not(IsNull()));

    queryBuilder
      .orderBy("guardian.createdAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .withDeleted()
      .where({ deletedAt })
      .leftJoin("guardian.profileImage", "profileImage")
      .andWhere(new Brackets(qb => {
        queryDto.search && qb.andWhere("LOWER(CONCAT(guardian.firstName, ' ', guardian.lastName)) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
      }))

    return paginatedData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const existingGuardian = await this.guardiansRepo.findOne({
      where: { id },
      relations: {
        students: true,
        profileImage: true
      }
    })
    if (!existingGuardian) throw new NotFoundException('Guardian not found')
    return existingGuardian
  }

  async update(id: string, updateGuardianDto: UpdateGuardianDto) {
    const existingGuardian = await this.findOne(id);
    const profileImage = (updateGuardianDto.profileImageId && updateGuardianDto.profileImageId !== existingGuardian.profileImage.id)
      ? await this.imagesService.findOne(updateGuardianDto.profileImageId)
      : existingGuardian.profileImage;

    /**
    |--------------------------------------------------
    | STUDENT IS NOT UPDATED
    |--------------------------------------------------
    */

    Object.assign(existingGuardian, updateGuardianDto);
    existingGuardian.profileImage = profileImage;
    const updatedGuardian = await this.getRepository<Guardian>(Guardian).save(existingGuardian);

    return this.guardianMutationReturn(updatedGuardian, 'updated');
  }

  async remove(id: string) {
    const existingGuardian = await this.findOne(id);
    const deletedGuardian = await this.guardiansRepo.softRemove(existingGuardian);

    return this.guardianMutationReturn(deletedGuardian, 'deleted');
  }

  private guardianMutationReturn = (student: Guardian, type: 'created' | 'updated' | 'deleted') => {
    return {
      message: type === 'created' ? 'Guardian created successfully' : type === 'deleted' ? 'Guardian deleted successfully' : 'Guardian updated successfully',
      guardian: {
        id: student.id,
        name: student.firstName + ' ' + student.lastName
      }
    }
  }
}
