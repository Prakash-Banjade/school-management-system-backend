import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { BaseRepository } from 'src/common/repository/base-repository';
import { DataSource } from 'typeorm';
import { Payroll } from '../payrolls/entities/payroll.entity';
import { CreateSalaryPaymentDto } from './dto/create-salary-payment.dto';
import { SalaryPayment } from './entities/salary-payment.entity';
import { EmployeeLedger, EmployeeLedgerType } from '../employee-ledgers/entities/employee-ledger.entity';
import { Teacher } from 'src/teachers/entities/teacher.entity';
import { Staff } from 'src/staffs/entities/staff.entity';

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
}
