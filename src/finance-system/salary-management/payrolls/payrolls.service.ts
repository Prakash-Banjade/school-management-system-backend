import { BadRequestException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { BaseRepository } from 'src/common/repository/base-repository';
import { DataSource } from 'typeorm';
import { CreatePayrollDto } from './dto/create-payroll.dto';
import { SalaryStructure } from '../salary-structures/entities/salary-structure.entity';
import { Payroll } from './entities/payroll.entity';
import { Teacher } from 'src/teachers/entities/teacher.entity';
import { Staff } from 'src/staffs/entities/staff.entity';
import { ESalaryAdjustmentType } from '../salary-adjustments/entities/salary-adjustment.entity';
import { isBefore, isSameMonth, isSameYear } from 'date-fns';

@Injectable({ scope: Scope.REQUEST })
export class PayrollsService extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) private req: FastifyRequest
    ) { super(dataSource, req); }

    async create(dto: CreatePayrollDto) {
        const salaryStructure: {
            id: string;
            grossSalary: number;
            teacherId: string | null;
            staffId: string | null;
            payAmount: number;
            date: string | null;
            advanceAmount: number | null;
        } | null = await this.getRepository(SalaryStructure).createQueryBuilder('salaryStructure')
            .leftJoin('salaryStructure.teacher', 'teacher')
            .leftJoin('salaryStructure.staff', 'staff')
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
            .where('teacher.id = :employeeId OR staff.id = :employeeId', { employeeId: dto.employeeId })
            .select([
                'salaryStructure.id as id',
                'salaryStructure.grossSalary as grossSalary',
                'teacher.id as teacherId',
                'staff.id as staffId',
                'CASE WHEN teacher.id IS NOT NULL THEN teacher.payAmount ELSE staff.payAmount END as payAmount',
                'latestPayroll.date as date',
                'latestPayroll.advanceAmount as advanceAmount',
            ])
            .getRawOne();

        if (!salaryStructure) throw new NotFoundException('Employee not found');

        if (salaryStructure.date && this.sameSalaryMonthOrBefore(salaryStructure.date, dto.date)) throw new BadRequestException('Payroll already created for this month');

        const teacher = salaryStructure.teacherId ? {
            id: salaryStructure.teacherId,
            payAmount: salaryStructure.payAmount,
        } as Teacher : null;

        const staff = salaryStructure.staffId ? {
            id: salaryStructure.staffId,
            payAmount: salaryStructure.payAmount,
        } as Staff : null;

        const payroll = this.getRepository(Payroll).create({
            date: dto.date,
            grossSalary: salaryStructure.grossSalary,
            salaryAdjustments: salaryStructure.advanceAmount !== null
                ? [
                    ...dto.salaryAdjustments,
                    {
                        amount: salaryStructure.advanceAmount,
                        type: ESalaryAdjustmentType.Deduction,
                        description: 'Past Advance'
                    }
                ]
                : dto.salaryAdjustments,
            // either one of the teacher or staff will be null
            teacher,
            staff,
        });

        payroll.calculateNetSalary(); // calculate net salary

        await this.getRepository(Payroll).save(payroll);

        return {
            message: 'Payroll created',
        };
    }

    private readonly sameSalaryMonthOrBefore = (lastSalaryDate: string, newSalaryDate: string) => {
        return isBefore(newSalaryDate, lastSalaryDate) || (isSameMonth(newSalaryDate, lastSalaryDate) && isSameYear(newSalaryDate, lastSalaryDate));
    }
}
