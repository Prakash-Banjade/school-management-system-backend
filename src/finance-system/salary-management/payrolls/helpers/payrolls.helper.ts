import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { FastifyRequest } from "fastify";
import { BaseRepository } from "src/common/repository/base-repository";
import { Brackets, DataSource } from "typeorm";
import { GetEmployeesQueryDto } from "../dto/payroll-query.dto";
import { SalaryStructure } from "../../salary-structures/entities/salary-structure.entity";
import { paginatedRawData } from "src/utils/paginatedData";
import { Payroll } from "../entities/payroll.entity";
import { ESalaryAdjustmentType } from "../../salary-adjustments/entities/salary-adjustment.entity";
import { UtilitiesService } from "src/utilities/utilities.service";

@Injectable()
export class PayrollsHelper extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
        private readonly utilitiesService: UtilitiesService,
    ) { super(dataSource, req) }

    getEmployees(queryDto: GetEmployeesQueryDto) {
        const branchId = this.utilitiesService.getBranchId();

        // getting employees based on the salary structure instead of account or individual teacher or staff entity
        const querybuilder = this.getRepository(SalaryStructure).createQueryBuilder('salaryStructure')
            .limit(queryDto.take)
            .offset(queryDto.skip)
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
                'CASE WHEN teacher.id IS NOT NULL THEN teacher.id ELSE staff.id END as id',
                'CASE WHEN teacher.id IS NOT NULL THEN teacher.payAmount ELSE staff.payAmount END as payAmount',
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
                    as designation
                `,
            ])
            .orderBy(`
                CASE WHEN teacher.id IS NOT NULL THEN
                    teacher.payAmount
                ELSE
                    staff.payAmount
                END
            `, queryDto.order);

        return paginatedRawData(queryDto, querybuilder);
    }

    async getEmployee(employeeId: string) { // employeeId is not pk, is teacherId or staffId
        const salaryStructure = await this.getRepository(SalaryStructure).createQueryBuilder('salaryStructure')
            .leftJoin('salaryStructure.teacher', 'teacher')
            .leftJoin('teacher.profileImage', 'teacherProfileImage')
            .leftJoin('salaryStructure.staff', 'staff')
            .leftJoin('staff.profileImage', 'staffProfileImage')
            .leftJoin(
                qb => {
                    return qb
                        .select('payroll.id', 'id')
                        .addSelect('payroll.date', 'date')
                        .addSelect('SUM(salaryAdjustments.amount)', 'advanceAmount') // calculate advance amount of last date
                        .addSelect('payroll.teacherId', 'teacherId')
                        .addSelect('payroll.staffId', 'staffId')
                        .addSelect('payroll.createdAt', 'createdAt')
                        .from(Payroll, 'payroll')
                        .leftJoin('payroll.salaryAdjustments', 'salaryAdjustments', 'salaryAdjustments.type = :type', { type: ESalaryAdjustmentType.Advance })
                        .groupBy('payroll.id');
                },
                'latestPayroll',
                '(latestPayroll.teacherId = teacher.id OR latestPayroll.staffId = staff.id) AND latestPayroll.createdAt = ' +
                '(SELECT MAX(innerPayroll.createdAt) FROM payroll innerPayroll WHERE (innerPayroll.teacherId = teacher.id OR innerPayroll.staffId = staff.id))'
            )
            .where('teacher.teacherId = :employeeId OR staff.staffId = :employeeId', { employeeId: employeeId })
            .select([
                `
                    CASE WHEN teacher.id IS NOT NULL THEN JSON_OBJECT(
                        'id', teacher.id,
                        'payAmount', teacher.payAmount,
                        'fullName', CONCAT(teacher.firstName, " ", teacher.lastName),
                        'employeeId', teacher.teacherId,
                        'designation', 'teacher', 
                        'phone', teacher.phone,
                        'email', teacher.email,
                        'profileImageUrl', teacherProfileImage.url
                    ) ELSE JSON_OBJECT(
                        'id', staff.id,
                        'payAmount', staff.payAmount,
                        'fullName', CONCAT(staff.firstName, " ", staff.lastName),
                        'employeeId', staff.staffId,
                        'designation', staff.type,
                        'phone', staff.phone,
                        'email', staff.email,
                        'profileImageUrl', staffProfileImage.url
                    ) END
                    as employee
                `,
                'latestPayroll.date as lastPayrollDate',
                'latestPayroll.advanceAmount as lastAdvanceAmount',
                'salaryStructure.basicSalary as basicSalary',
                'salaryStructure.grossSalary as grossSalary',
                'salaryStructure.allowances as allowances',
            ])
            .getRawOne();

        if (!salaryStructure) throw new NotFoundException('Employee not found');

        return {
            ...salaryStructure,
            employee: typeof salaryStructure.employee === 'string'
                ? JSON.parse(salaryStructure.employee)
                : salaryStructure.employee,
            allowances: typeof salaryStructure.allowances === 'string'
                ? JSON.parse(salaryStructure.allowances)
                : salaryStructure.allowances,
        }
    }
}