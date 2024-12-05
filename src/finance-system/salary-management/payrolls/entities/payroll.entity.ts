import { BaseEntity } from "src/common/entities/base.entity";
import { EMonth } from "src/common/types/months";
import { BeforeInsert, Column, Entity, OneToMany, OneToOne } from "typeorm";
import { SalaryAdjustment } from "../../salary-adjustments/entities/salary-adjustment.entity";
import { SalaryPayment } from "../../salary-payemnts/entities/salary-payment.entity";
import { EmployeeLedger } from "../../employee-ledgers/entities/employee-ledger.entity";

@Entity()
export class Payroll extends BaseEntity {

    @Column({ type: 'enum', enum: EMonth })
    month: EMonth;

    @Column({ type: 'float' })
    grossSalary: number;

    @Column({ type: 'float' })
    netSalary: number;

    @OneToMany(() => SalaryAdjustment, adjustment => adjustment.payroll, { cascade: true })
    salaryAdjustments: SalaryAdjustment[];

    @BeforeInsert()
    calculateNetSalary() {
        const adjustmentAmount = this.salaryAdjustments?.reduce((acc, curr) => acc + curr.amount, 0); // for deductions, amount is negative
        this.netSalary = this.grossSalary + adjustmentAmount;
    }

    @OneToMany(() => SalaryPayment, payment => payment.payroll, { cascade: true })
    salaryPayments: SalaryPayment[];

    @OneToOne(() => EmployeeLedger, ledger => ledger.payroll, { onDelete: 'CASCADE' })
    ledger: EmployeeLedger;
}