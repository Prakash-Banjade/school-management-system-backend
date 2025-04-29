import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { BaseRepository } from 'src/common/repository/base-repository';
import { Brackets, DataSource } from 'typeorm';
import { SalaryStructuresQueryDto } from './dto/salary-structures-query.dto';
import { SalaryStructure } from './entities/salary-structure.entity';
import { paginatedRawData } from 'src/utils/paginatedData';
import { UpdateSalaryStructureDto } from './dto/update-salary-structure.dto';
import { UtilitiesService } from 'src/utilities/utilities.service';
import { AuthUser } from 'src/common/types/global.type';
import { isTeacher } from 'src/utils/utils';
import { SalaryPayment } from '../salary-payemnts/entities/salary-payment.entity';
import { startOfYear } from 'date-fns';

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
            .leftJoin('staff.account', 'staffAccount', 'staff.id IS NOT NULL');

        if (queryDto.search) {
            querybuilder.andWhere(new Brackets(qb => {
                qb.andWhere(`teacherAccount.lowerCasedFullName LIKE LOWER(:search)`, { search: `${queryDto.search}%` })
                    .orWhere(`staffAccount.lowerCasedFullName LIKE LOWER(:search)`, { search: `${queryDto.search}%` })
                    .orWhere('teacher.teacherId = :exactSearch', { exactSearch: queryDto.search })
                    .orWhere('staff.staffId = :exactSearch', { exactSearch: queryDto.search });
            }));
        }

        if (branchId) {
            querybuilder.andWhere('teacherAccount.branchId = :branchId OR staffAccount.branchId = :branchId', { branchId });
        }

        if (queryDto.designations?.length) {
            querybuilder.andWhere('teacherAccount.role IN (:...roles) OR staff.type IN (:...roles)', { roles: queryDto.designations });
        }

        querybuilder
            .select([
                'salaryStructure.id as id',
                'salaryStructure.basicSalary as basicSalary',
                'salaryStructure.allowances as allowances',
                'salaryStructure.grossSalary as grossSalary',
                `
                    CASE WHEN teacher.id IS NOT NULL THEN
                        CONCAT(teacher.firstName, ' ', teacher.lastName)
                    ELSE
                        CONCAT(staff.firstName, ' ', staff.lastName)
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

    async getMySalaryDetails(currentUser: AuthUser) {
        if (!isTeacher(currentUser)) throw new ForbiddenException("Access denied");

        const salaryStructure = await this.getRepository(SalaryStructure).findOne({
            where: {
                teacher: { id: currentUser.teacherId }
            },
            relations: { teacher: true },
            select: { id: true, basicSalary: true, allowances: true, grossSalary: true, teacher: { id: true, payAmount: true } }
        });

        const thisYearTotalPayment = await this.getRepository(SalaryPayment).createQueryBuilder('payment')
            .innerJoin("payment.ledger", "ledger", "ledger.teacher = :teacherId", { teacherId: currentUser.teacherId })
            .where("payment.paymentDate >= :startDate AND payment.paymentDate <= :endDate", {
                startDate: startOfYear(new Date()),
                endDate: new Date(),
            })
            .select([
                'SUM(payment.amount) as totalPayment',
            ])
            .getRawOne();

        return {
            ...salaryStructure,
            totalPayment: thisYearTotalPayment.totalPayment
        }
    }
}
