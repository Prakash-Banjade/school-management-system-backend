import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { BaseRepository } from 'src/common/repository/base-repository';
import { Brackets, DataSource } from 'typeorm';
import { CreatePayrollDto, UpdatePayrollDto } from './dto/payroll.dto';
import { IAllowance, SalaryStructure } from '../salary-structures/entities/salary-structure.entity';
import { Payroll } from './entities/payroll.entity';
import { Teacher } from 'src/teachers/entities/teacher.entity';
import { Staff } from 'src/staffs/entities/staff.entity';
import { ESalaryAdjustmentType, SalaryAdjustment } from '../salary-adjustments/entities/salary-adjustment.entity';
import { addMonths, isBefore, isSameMonth, subMonths } from 'date-fns';
import { SalaryPayment } from '../salary-payemnts/entities/salary-payment.entity';
import { UtilitiesService } from 'src/utilities/utilities.service';
import { AuthUser } from 'src/common/types/global.type';
import { isAdmin, isTeacher, startOfDayString } from 'src/utils/utils';
import { paginatedRawData } from 'src/utils/paginatedData';
import { PayrollsQueryDto } from './dto/payroll-query.dto';
import { AttendancesHelper } from 'src/attendances/helpers/attendances.helper';
import { ISalaryStructure } from './interface';

@Injectable({ scope: Scope.REQUEST })
export class PayrollsService extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) private req: FastifyRequest,
        private readonly utilitiesService: UtilitiesService,
        private readonly attendancesHelper: AttendancesHelper
    ) { super(dataSource, req); }

    async create(dto: CreatePayrollDto, currentUser: AuthUser) {
        const branchId = this.utilitiesService.getBranchId();

        const salaryStructure: ISalaryStructure | null = await this.getRepository(SalaryStructure).createQueryBuilder('salaryStructure')
            .leftJoin('salaryStructure.teacher', 'teacher')
            .leftJoin('salaryStructure.staff', 'staff')
            .leftJoin('teacher.account', 'teacherAccount')
            .leftJoin('staff.account', 'staffAccount')
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
            .where(new Brackets(qb => {
                if (branchId) {
                    qb.andWhere(
                        dto.employeeType === 'teacher'
                            ? 'teacherAccount.branchId = :branchId'
                            : 'staffAccount.branchId = :branchId'
                        , { branchId })
                }
            }))
            .andWhere(
                dto.employeeType === 'teacher'
                    ? 'teacher.id = :employeeId'
                    : 'staff.id = :employeeId'
                ,
                { employeeId: dto.employeeId }
            )
            .select([
                'salaryStructure.id as id',
                'salaryStructure.basicSalary as basicSalary',
                'salaryStructure.allowances as allowances',
                'teacher.id as teacherId',
                'staff.id as staffId',
                'CASE WHEN teacher.id IS NOT NULL THEN teacher.payAmount ELSE staff.payAmount END as payAmount',
                'CASE WHEN teacher.id IS NOT NULL THEN teacherAccount.id ELSE staffAccount.id END as accountId',
                'latestPayroll.date as date',
                'latestPayroll.advanceAmount as advanceAmount',
            ])
            .getRawOne();

        if (!salaryStructure) throw new NotFoundException('Employee not found');

        const salaryDate = salaryStructure.date ? addMonths(salaryStructure.date, 1) : subMonths(new Date(), 1);

        if (!isBefore(salaryDate, new Date()) || isSameMonth(salaryDate, new Date())) throw new BadRequestException('Cannot generate payroll for future months.');

        const teacher = salaryStructure.teacherId ? {
            id: salaryStructure.teacherId,
            payAmount: salaryStructure.payAmount,
        } as Teacher : null;

        const staff = salaryStructure.staffId ? {
            id: salaryStructure.staffId,
            payAmount: salaryStructure.payAmount,
        } as Staff : null;

        const allowanceAmount: number | null = typeof salaryStructure.allowances === 'string'
            ? (JSON.parse(salaryStructure.allowances) as IAllowance[])?.reduce((acc, curr) => acc + curr.amount, 0)
            : salaryStructure.allowances?.reduce((acc, curr) => acc + curr.amount, 0);

        const absentAdjustment = await this.getAbsentAdjustment(salaryDate, salaryStructure, currentUser);
        const adjustments = dto.salaryAdjustments.filter(s => s.type !== ESalaryAdjustmentType.Absent);

        const payroll = this.getRepository(Payroll).create({
            date: startOfDayString(salaryDate),
            basicSalary: salaryStructure.basicSalary, // allowances are included in adjustments to separately show entries in template
            salaryAdjustments: [
                ...adjustments,
                salaryStructure.advanceAmount !== null
                    ? {
                        amount: salaryStructure.advanceAmount,
                        type: ESalaryAdjustmentType.Past_Advance,
                        description: 'Past Advance'
                    } : null,
                {
                    ...absentAdjustment
                },
                {
                    amount: allowanceAmount ?? 0,
                    type: ESalaryAdjustmentType.Allowance,
                    description: 'Allowance',
                },
                {
                    amount: teacher?.id ? teacher.payAmount : staff.payAmount,
                    type: ESalaryAdjustmentType.Unpaid,
                    description: 'Unpaid Salary',
                }
            ].filter(Boolean),
            // either one of the teacher or staff will be null
            teacher,
            staff,
        });

        // TODO: generate a pdf and save it in some object store or backend

        payroll.calculateNetSalary(); // calculate net salary

        if (payroll.netSalary < 0) throw new BadRequestException('Something seems wrong with the salary structure or adjustments');

        await this.getRepository(Payroll).save(payroll);

        // update pay amount in employee
        teacher?.id
            ? await this.getRepository(Teacher).update(teacher.id, { payAmount: payroll.netSalary })
            : await this.getRepository(Staff).update(staff.id, { payAmount: payroll.netSalary });

        return { message: 'Payroll created' };
    }

    async getAbsentAdjustment(salaryDate: Date, salaryStructure: ISalaryStructure, currentUser: AuthUser) {
        // calculate absent amount
        const count = await this.attendancesHelper.getCount({
            onlyMonthly: true,
            accountId: salaryStructure.accountId,
            month: salaryDate.getMonth() + 1,
            year: salaryDate.getFullYear(), // need to send year, otherwise totalDays will be undefined
        }, currentUser);

        const absentCount = +(count?.monthly.absent ?? 0);
        const totalDays = +(count?.monthly.total ?? 30);

        if (absentCount === 0) return {};

        const absentAdjustment = {
            amount: Math.round((absentCount / totalDays) * salaryStructure.basicSalary),
            description: `Absent Fine (${absentCount} days)`,
            type: ESalaryAdjustmentType.Absent,
        }

        return absentAdjustment;
    }

    async getLastPayroll(employeeId: string) {
        const payroll = await this.getRepository(Payroll).createQueryBuilder('payroll')
            .leftJoin('payroll.salaryAdjustments', 'salaryAdjustments')
            .leftJoin('payroll.salaryPayments', 'salaryPayments')
            .leftJoin('payroll.teacher', 'teacher')
            .leftJoin('payroll.staff', 'staff')
            .where('teacher.id = :employeeId OR staff.id = :employeeId', { employeeId })
            .select([
                'payroll.id as id',
                'payroll.date as date',
                'payroll.netSalary as netSalary',
                'payroll.basicSalary as basicSalary',
                `
                    CASE WHEN teacher.id IS NOT NULL THEN JSON_OBJECT(
                        'id', teacher.id,
                        'fullName', CONCAT(teacher.firstName, ' ', teacher.lastName),
                        'employeeId', teacher.teacherId,
                        'designation', 'teacher', 
                        'phone', teacher.phone,
                        'email', teacher.email
                    ) ELSE JSON_OBJECT(
                        'id', staff.id,
                        'fullName', CONCAT(staff.firstName, ' ', staff.lastName),
                        'employeeId', staff.staffId,
                        'designation', staff.type,
                        'phone', staff.phone,
                        'email', staff.email
                    ) END
                    as employee
                `,
                `
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', salaryAdjustments.id,
                            'type', salaryAdjustments.type,
                            'amount', salaryAdjustments.amount,
                            'description', salaryAdjustments.description
                        )
                    ) as salaryAdjustments
                `,
            ])
            .groupBy('payroll.id')
            .addGroupBy('salaryPayments.id')
            .orderBy('payroll.date', 'DESC')
            .limit(1)
            .getRawOne();

        if (!payroll?.employee) return null;

        // TODO: this can be achieved from above query also, but something doesn't work
        const salaryPayments = await this.getRepository(SalaryPayment).createQueryBuilder('salaryPayment')
            .where('salaryPayment.payrollId = :payrollId', { payrollId: payroll.id })
            .select('SUM(salaryPayment.amount) as amount')
            .getRawOne();

        return {
            ...payroll,
            employee: typeof payroll.employee === 'string'
                ? JSON.parse(payroll.employee)
                : payroll.employee,
            salaryAdjustments: typeof payroll.salaryAdjustments === 'string'
                ? JSON.parse(payroll.salaryAdjustments) ?? []
                : payroll.salaryAdjustments,
            paidSalary: salaryPayments?.amount ?? 0,
        };
    }

    async update(id: string, dto: UpdatePayrollDto) {
        const existing = await this.getRepository(Payroll).findOne({
            where: { id },
            relations: {
                salaryPayments: true,
                salaryAdjustments: true,
                staff: true,
                teacher: true,
            },
            select: {
                salaryPayments: { id: true },
                salaryAdjustments: { id: true, type: true, amount: true, description: true },
                staff: { id: true },
                teacher: { id: true },
            }
        });

        if (!existing) throw new NotFoundException('Payroll not found');

        if (existing.salaryPayments?.length > 0) throw new ForbiddenException('This payroll cannot be updated now');

        Object.assign(existing, {
            ...existing,
            salaryAdjustments: [
                // adjustments with these three types are not updated
                ...existing.salaryAdjustments?.filter(a => [ESalaryAdjustmentType.Allowance, ESalaryAdjustmentType.Past_Advance, ESalaryAdjustmentType.Unpaid].includes(a.type)),
                ...dto.salaryAdjustments,
            ]
        });

        existing.calculateNetSalary();

        await this.getRepository(Payroll).save(existing);

        existing.teacher?.id
            ? await this.getRepository(Teacher).update(existing.teacher.id, { payAmount: existing.netSalary })
            : await this.getRepository(Staff).update(existing.staff?.id, { payAmount: existing.netSalary });

        return {
            message: 'Payroll updated'
        }
    }

    async getAll(queryDto: PayrollsQueryDto, currentUser: AuthUser) {
        const employeeId = isTeacher(currentUser) ? currentUser.teacherId : queryDto.employeeId;

        if (!employeeId) throw new BadRequestException('Employee ID is required');

        const querybuilder = this.getRepository(Payroll).createQueryBuilder('payroll')
            .orderBy('payroll.createdAt', 'DESC')
            .limit(queryDto.take)
            .offset(queryDto.skip)
            .where(new Brackets(qb => {
                queryDto.dateFrom && qb.andWhere('DATE(payroll.date) >= :dateFrom', { dateFrom: queryDto.dateFrom });
                queryDto.dateTo && qb.andWhere('DATE(payroll.date) <= :dateTo', { dateTo: queryDto.dateTo });
            }))

        if (isTeacher(currentUser)) {
            querybuilder.where("payroll.teacherId = :employeeId", { employeeId: employeeId });
        }

        if (isAdmin(currentUser)) {
            querybuilder
                .leftJoin('payroll.teacher', 'teacher')
                .leftJoin('payroll.staff', 'staff')
                .andWhere("teacher.teacherId = :employeeId OR staff.staffId = :employeeId", { employeeId: employeeId }); // when admin is requesting he sends employeeId as teacher.teacherId not teacher.id
        }

        querybuilder.select([
            'payroll.id as id',
            'payroll.date as date',
            'payroll.netSalary as netSalary',
            'payroll.basicSalary as basicSalary',
        ]);

        return paginatedRawData(queryDto, querybuilder);
    }

    async findOne(id: string, currentUser: AuthUser) {
        const querybuilder = this.getRepository(Payroll).createQueryBuilder('payroll')
            .leftJoin('payroll.salaryAdjustments', 'salaryAdjustments')
            .leftJoin('payroll.salaryPayments', 'salaryPayments')
            .leftJoin('payroll.teacher', 'teacher')
            .where('payroll.id = :id', { id });

        if (isTeacher(currentUser)) {
            querybuilder.andWhere('teacher.id = :teacherId', { teacherId: currentUser.teacherId })
        }

        querybuilder
            .select([
                'payroll.id as id',
                'payroll.date as date',
                'payroll.netSalary as netSalary',
                'payroll.basicSalary as basicSalary',
                `
                    JSON_OBJECT(
                        'id', teacher.id,
                        'fullName', CONCAT(teacher.firstName, ' ', teacher.lastName),
                        'employeeId', teacher.teacherId,
                        'designation', 'teacher', 
                        'phone', teacher.phone,
                        'email', teacher.email
                    )
                    as employee
                `,
                `
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', salaryAdjustments.id,
                            'type', salaryAdjustments.type,
                            'amount', salaryAdjustments.amount,
                            'description', salaryAdjustments.description
                        )
                    ) as salaryAdjustments
                `,
            ])
            .groupBy('payroll.id')
            .addGroupBy('salaryPayments.id')


        const payroll = await querybuilder.getRawOne();

        if (!payroll?.employee) return null;

        // TODO: this can be achieved from above query also, but something doesn't work
        const salaryPayments = await this.getRepository(SalaryPayment).createQueryBuilder('salaryPayment')
            .where('salaryPayment.payrollId = :payrollId', { payrollId: payroll.id })
            .select('SUM(salaryPayment.amount) as amount')
            .getRawOne();

        return {
            ...payroll,
            employee: typeof payroll.employee === 'string'
                ? JSON.parse(payroll.employee)
                : payroll.employee,
            salaryAdjustments: typeof payroll.salaryAdjustments === 'string'
                ? JSON.parse(payroll.salaryAdjustments) ?? []
                : payroll.salaryAdjustments,
            paidSalary: salaryPayments?.amount ?? 0,
        };

    }
}
