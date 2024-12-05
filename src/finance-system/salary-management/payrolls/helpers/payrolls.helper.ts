import { Inject, Injectable } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { FastifyRequest } from "fastify";
import { BaseRepository } from "src/common/repository/base-repository";
import { Brackets, DataSource } from "typeorm";
import { GetEmployeesQueryDto } from "../dto/payroll-query.dto";
import { SalaryStructure } from "../../salary-structures/entities/salary-structure.entity";
import { paginatedRawData } from "src/utils/paginatedData";

@Injectable()
export class PayrollsHelper extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    ) { super(dataSource, req) }

    getEmployees(queryDto: GetEmployeesQueryDto) {
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

                queryDto.designations?.length && qb.andWhere('teacherAccount.role IN (:...roles) OR staffAccount.role IN (:...roles)', { roles: queryDto.designations });
            }))
            .addSelect('CASE WHEN teacher.id IS NOT NULL THEN teacher.payAmount ELSE staff.payAmount END', 'payAmount')
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
                        staffAccount.role
                    END
                    as designation
                `,
            ]);

        return paginatedRawData(queryDto, querybuilder);
    }
}