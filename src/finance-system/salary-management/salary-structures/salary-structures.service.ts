import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { BaseRepository } from 'src/common/repository/base-repository';
import { Brackets, DataSource } from 'typeorm';
import { SalaryStructuresQueryDto } from './dto/salary-structures-query.dto';
import { SalaryStructure } from './entities/salary-structure.entity';
import { paginatedRawData } from 'src/utils/paginatedData';
import { UpdateSalaryStructureDto } from './dto/update-salary-structure.dto';
import { Teacher } from 'src/teachers/entities/teacher.entity';
import { Staff } from 'src/staffs/entities/staff.entity';
import { UtilitiesService } from 'src/utilities/utilities.service';

@Injectable()
export class SalaryStructuresService extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) private req: FastifyRequest,
        private readonly utilitiesService: UtilitiesService,
    ) { super(dataSource, req); }

    findAll(queryDto: SalaryStructuresQueryDto) {
        const branchId = this.utilitiesService.getBranchId();

        const querybuilder = this.getRepository(SalaryStructure).createQueryBuilder('salaryStructure')
            .limit(queryDto.take)
            .offset(queryDto.skip)
            .orderBy(queryDto.sortBy, queryDto.order)
            .leftJoin('salaryStructure.teacher', 'teacher')
            .leftJoin('teacher.account', 'teacherAccount', 'teacher.id IS NOT NULL')
            .leftJoin('salaryStructure.staff', 'staff')
            .leftJoin('staff.account', 'staffAccount', 'staff.id IS NOT NULL')
            .where(new Brackets(qb => {
                queryDto.search && qb.andWhere(new Brackets(subQb => {
                    subQb.orWhere('LOWER(CONCAT(teacher.firstName, " ", teacher.lastName)) LIKE LOWER(:search)', { search: `%${queryDto.search}%` })
                        .orWhere('LOWER(CONCAT(staff.firstName, " ", staff.lastName)) LIKE LOWER(:search)', { search: `%${queryDto.search}%` })
                        .orWhere('teacher.teacherId = :exactSearch', { exactSearch: queryDto.search })
                        .orWhere('staff.staffId = :exactSearch', { exactSearch: queryDto.search });
                }));

                if (branchId) {
                    qb.andWhere('teacherAccount.branchId = :branchId OR staffAccount.branchId = :branchId', { branchId });
                }

                queryDto.designations?.length && qb.andWhere('teacherAccount.role IN (:...roles) OR staff.type IN (:...roles)', { roles: queryDto.designations });
            }))
            .select([
                'salaryStructure.id as id',
                'salaryStructure.basicSalary as basicSalary',
                'salaryStructure.allowances as allowances',
                'salaryStructure.grossSalary as grossSalary',
                `
                    CASE WHEN teacher.id IS NOT NULL THEN
                        CONCAT(teacher.firstName, " ", teacher.lastName)
                    ELSE
                        CONCAT(staff.firstName, " ", staff.lastName)
                    END
                    as fullName
                `,
                `
                    CASE WHEN teacher.id IS NOT NULL THEN
                        teacher.teacherId
                    ELSE
                        staff.staffId
                    END
                    as employeeId
                `,
                `
                    CASE WHEN teacherAccount.id IS NOT NULL THEN
                        teacherAccount.role
                    ELSE
                        staff.type
                    END
                    as designation`,
                'teacher.id as teacherId',
                'staff.id as staffId',
            ])

        return paginatedRawData(queryDto, querybuilder);
    }

    async findOne(id: string) {
        const existing = await this.getRepository(SalaryStructure).findOne({
            where: {
                id,
                teacher: { account: { branch: { id: this.utilitiesService.getBranchId() } } },
                staff: { account: { branch: { id: this.utilitiesService.getBranchId() } } },
            },
            select: { id: true, basicSalary: true, allowances: true }
        });

        if (!existing) throw new NotFoundException('Salary structure not found');

        return existing;
    }

    async update(id: string, dto: UpdateSalaryStructureDto) {
        const existing = await this.findOne(id);

        Object.assign(existing, dto);

        existing.setGrossSalary(); // update gross salary

        await this.getRepository(SalaryStructure).save(existing);

        return { message: 'Updated successfully' }
    }

    async createSalaryStructureForAllEmployees() { // TODO: remove in production
        const teachers = await this.getRepository(Teacher).find({
            select: { id: true }
        });
        const staffs = await this.getRepository(Staff).find({
            select: { id: true }
        });

        const teacherSalaryStructures = teachers.map(teacher => this.getRepository(SalaryStructure).create({
            basicSalary: 0,
            allowances: [],
            teacher
        }));

        const staffSalaryStructures = staffs.map(staff => this.getRepository(SalaryStructure).create({
            basicSalary: 0,
            allowances: [],
            staff
        }));

        await this.getRepository(SalaryStructure).save([...teacherSalaryStructures, ...staffSalaryStructures]);
    }
}
