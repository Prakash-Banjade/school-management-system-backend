import { BaseEntity } from "src/common/entities/base.entity";
import { Staff } from "src/staffs/entities/staff.entity";
import { Teacher } from "src/teachers/entities/teacher.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from "typeorm";
import { SalaryPayment } from "../../salary-payemnts/entities/salary-payment.entity";
import { Payroll } from "../../payrolls/entities/payroll.entity";

export enum EmployeeLedgerType {
    Salary_Payment = 'Salary_Payment',
    Advance_Payment = 'Advance_Payment',
    Deduction = 'Deduction',
    Bonus = 'Bonus'
}


@Entity()
export class EmployeeLedger extends BaseEntity {
    @Column({ type: 'float' })
    amount: number;

    @Column({ type: 'enum', enum: EmployeeLedgerType })
    transactionType: EmployeeLedgerType;

    @Column({ type: 'datetime' })
    date: string;

    @ManyToOne(() => Staff, staff => staff.ledgers, { onDelete: 'CASCADE' })
    staff: Staff;

    @ManyToOne(() => Teacher, teacher => teacher.ledgers, { onDelete: 'CASCADE' })
    teacher: Teacher;

    @OneToOne(() => SalaryPayment, payment => payment.ledger, { onDelete: 'CASCADE' })
    @JoinColumn()
    payment: SalaryPayment;

    @OneToOne(() => Payroll, payroll => payroll.ledger, { onDelete: 'CASCADE' })
    @JoinColumn()
    payroll: Payroll;
}