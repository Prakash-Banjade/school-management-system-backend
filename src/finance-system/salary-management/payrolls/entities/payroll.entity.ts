import { BaseEntity } from "src/common/entities/base.entity";
import { BeforeInsert, Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { ESalaryAdjustmentType, SalaryAdjustment } from "../../salary-adjustments/entities/salary-adjustment.entity";
import { Teacher } from "src/teachers/entities/teacher.entity";
import { Staff } from "src/staffs/entities/staff.entity";
import { SalaryPayment } from "../../salary-payemnts/entities/salary-payment.entity";

@Entity()
export class Payroll extends BaseEntity {
    @ManyToOne(() => Staff, staff => staff.payrolls, { onDelete: 'CASCADE' })
    staff: Staff;

    @ManyToOne(() => Teacher, teacher => teacher.payrolls, { onDelete: 'CASCADE' })
    teacher: Teacher;

    @Column({ type: 'datetime' })
    date: string;

    @Column({ type: 'float' })
    basicSalary: number;

    @Column({ type: 'float' })
    netSalary: number;

    @OneToMany(() => SalaryAdjustment, adjustment => adjustment.payroll, { cascade: true })
    salaryAdjustments: SalaryAdjustment[];

    @BeforeInsert()
    calculateNetSalary() {
        const adjustmentAmount = this.salaryAdjustments?.reduce((acc, curr) => {
            (curr.type === ESalaryAdjustmentType.Deduction || curr.type === ESalaryAdjustmentType.Past_Advance)
                ? acc -= curr.amount
                : acc += curr.amount;
            return acc;
        }, 0);
        this.netSalary = this.basicSalary + adjustmentAmount;
    }

    @OneToMany(() => SalaryPayment, payment => payment.payroll, { cascade: true })
    salaryPayments: SalaryPayment[];

    // @OneToOne(() => EmployeeLedger, ledger => ledger.payroll, { onDelete: 'CASCADE' })
    // ledger: EmployeeLedger;
}