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

    async findAll(queryDto: SalaryPaymentQueryDto) {
        const querybuilder = this.getRepository(SalaryPayment).createQueryBuilder('salaryPayment')
            .leftJoin('salaryPayment.payroll', 'payroll')
            .limit(queryDto.take)
            .offset(queryDto.skip)
            .orderBy('salaryPayment.paymentDate', 'DESC')
            .where(new Brackets(qb => {
                queryDto.employeeId && qb.andWhere('payroll.teacherId = :employeeId OR payroll.staffId = :employeeId', { employeeId: queryDto.employeeId });

                queryDto.dateFrom && qb.andWhere('DATE(salaryPayment.paymentDate) >= DATE(:dateFrom)', { dateFrom: queryDto.dateFrom });
                queryDto.dateTo && qb.andWhere('DATE(salaryPayment.paymentDate) <= DATE(:dateTo)', { dateTo: queryDto.dateTo });
            }))
            .select([
                'salaryPayment.id as id',
                'salaryPayment.paymentDate as paymentDate',
                'salaryPayment.paymentMethod as paymentMethod',
                'salaryPayment.remark as remark',
                'salaryPayment.amount as amount',
            ]);

        return paginatedRawData(queryDto, querybuilder);
    }
}
