import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { BaseRepository } from 'src/common/repository/base-repository';
import { Brackets, DataSource } from 'typeorm';
import { Payroll } from '../payrolls/entities/payroll.entity';
import { CreateSalaryPaymentDto } from './dto/create-salary-payment.dto';
import { SalaryPayment } from './entities/salary-payment.entity';
import { EmployeeLedger, EmployeeLedgerType } from '../employee-ledgers/entities/employee-ledger.entity';
import { Teacher } from 'src/teachers/entities/teacher.entity';
import { Staff } from 'src/staffs/entities/staff.entity';
import { SalaryPaymentQueryDto } from './dto/salary-payment-query.dto';
import { paginatedRawData } from 'src/utils/paginatedData';
import { AuthUser } from 'src/common/types/global.type';
import { isAdmin, isTeacher } from 'src/utils/utils';

@Injectable({ scope: Scope.REQUEST })
export class SalaryPaymentsService extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) private req: FastifyRequest,
    ) { super(dataSource, req); }

    async create(dto: CreateSalaryPaymentDto) {
        const payroll = await this.getRepository(Payroll).createQueryBuilder('payroll')
            .leftJoin('payroll.salaryPayments', 'salaryPayments')
            .leftJoin('payroll.teacher', 'teacher')
            .leftJoin('payroll.staff', 'staff')
            .where('teacher.id = :employeeId OR staff.id = :employeeId', { employeeId: dto.employeeId })
            .orderBy('payroll.date', 'DESC')
            .select([
                'payroll.id',
                'payroll.netSalary',
                'teacher.id',
                'teacher.payAmount',
                'staff.id',
                'staff.payAmount',
                'salaryPayments.amount'
            ])
            .getOne();

        if (!payroll) throw new NotFoundException('Payroll not found');

        const totalSalaryPaid = payroll.salaryPayments?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
        const remainingSalary = payroll.netSalary - totalSalaryPaid;

        if (remainingSalary === 0) throw new NotFoundException('No remaining salary to pay');
        if (remainingSalary < dto.amount) throw new NotFoundException('You are trying to pay more than remaining salary');

        const salaryPayment = this.getRepository(SalaryPayment).create({
            ...dto,
            payroll,
            ledger: this.getRepository(EmployeeLedger).create({
                amount: dto.amount,
                transactionType: EmployeeLedgerType.Salary_Payment,
                date: dto.paymentDate,
                staff: payroll.staff,
                teacher: payroll.teacher
            })
        });

        await this.getRepository(SalaryPayment).save(salaryPayment);

        payroll?.teacher
            ? await this.getRepository(Teacher).update({ id: payroll.teacher?.id }, { payAmount: payroll.teacher?.payAmount - salaryPayment.amount })
            : await this.getRepository(Staff).update({ id: payroll.staff?.id }, { payAmount: payroll.staff?.payAmount - salaryPayment.amount });

        return {
            message: 'Payment made successfully',
        }
    }

    async findAll(queryDto: SalaryPaymentQueryDto, currentUser: AuthUser) {
        const querybuilder = this.getRepository(SalaryPayment).createQueryBuilder('salaryPayment')
            .leftJoin('salaryPayment.payroll', 'payroll')
            .where(new Brackets(qb => {
                queryDto.dateFrom && qb.andWhere('DATE(salaryPayment.paymentDate) >= DATE(:dateFrom)', { dateFrom: queryDto.dateFrom });
                queryDto.dateTo && qb.andWhere('DATE(salaryPayment.paymentDate) <= DATE(:dateTo)', { dateTo: queryDto.dateTo });
            }));

        if (isAdmin(currentUser) && queryDto.employeeId) {
            querybuilder.andWhere('payroll.teacherId = :employeeId OR payroll.staffId = :employeeId', { employeeId: queryDto.employeeId })
        }

        if (isTeacher(currentUser)) {
            querybuilder.andWhere('payroll.teacherId = :teacherId', { teacherId: currentUser.teacherId });
        }

        querybuilder
            .select([
                'salaryPayment.id as id',
                'salaryPayment.paymentDate as paymentDate',
                'salaryPayment.paymentMethod as paymentMethod',
                'salaryPayment.remark as remark',
                'salaryPayment.amount as amount',
                'payroll.date as salaryDate',
                'payroll.id as payrollId'
            ])
            .limit(queryDto.take)
            .offset(queryDto.skip)
            .orderBy('salaryPayment.createdAt', 'DESC')

        return paginatedRawData(queryDto, querybuilder);
    }

    async findOne(id: string, currentUser: AuthUser) {
        const querybuilder = this.getRepository(SalaryPayment).createQueryBuilder('payment')
            .where('payment.id = :id', { id })
            .leftJoin('payment.payroll', 'payroll')
            .leftJoin('payroll.teacher', 'teacher')
            .leftJoin('payroll.salaryAdjustments', 'salaryAdjustments');

        if (isTeacher(currentUser)) {
            querybuilder.andWhere('teacher.id = :teacherId', { teacherId: currentUser.teacherId });
        }

        querybuilder.select([
            "payment.id",
            "payroll.id",
            "payroll.date",
            "payroll.netSalary",
            "payroll.basicSalary",
            "teacher.id",
            "teacher.firstName",
            "teacher.lastName",
            "teacher.teacherId",
            "teacher.email",
            "teacher.phone",
            "salaryAdjustments.id",
            "salaryAdjustments.type",
            "salaryAdjustments.amount",
            "salaryAdjustments.description"
        ]);

        return querybuilder.getOne();
    }
}
