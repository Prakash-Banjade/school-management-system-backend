import { BaseEntity } from "src/common/entities/base.entity";
import { EPaymentMethod } from "src/common/types/global.type";
import { Column, Entity, ManyToOne, OneToOne } from "typeorm";
import { Payroll } from "../../payrolls/entities/payroll.entity";
import { EmployeeLedger } from "../../employee-ledgers/entities/employee-ledger.entity";

@Entity()
export class SalaryPayment extends BaseEntity {
    @Column({ type: 'float' })
    amount: number;

    @Column({ type: 'datetime' })
    paymentDate: string;

    @Column({ type: 'enum', enum: EPaymentMethod })
    paymentMethod: EPaymentMethod;

    @ManyToOne(() => Payroll, payroll => payroll.salaryPayments, { onDelete: 'CASCADE' })
    payroll: Payroll;

    @OneToOne(() => EmployeeLedger, ledger => ledger.payment, { onDelete: 'CASCADE' })
    ledger: EmployeeLedger;
}