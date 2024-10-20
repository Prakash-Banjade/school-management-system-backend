import { Account } from "src/auth-system/accounts/entities/account.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { ESalaryStatus } from "src/common/types/global.type";
import { generateTeacherId } from "src/utils/generate-teacher-id";
import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne } from "typeorm";

@Entity()
export class Salary extends BaseEntity {
    @Column({ type: 'int' })
    salaryId: number;

    @BeforeInsert()
    @BeforeUpdate()
    generateSalaryId() {
        if (!this.salaryId) this.salaryId = generateTeacherId();
    }

    @Column({ type: 'real' })
    bonus: number;

    @Column({ type: 'real' })
    deduction: number;

    @Column({ type: 'real' })
    wage: number;

    @Column({ type: 'real', precision: 10, scale: 2 })
    netSalary: number;

    @BeforeInsert()
    @BeforeUpdate()
    calculateNetSalary() {
        this.netSalary = this.wage - this.deduction + this.bonus;
    }

    @Column({ type: 'datetime' })
    salaryDate: string;

    @Column({ type: 'enum', enum: ESalaryStatus, default: ESalaryStatus.PENDING })
    status: ESalaryStatus

    @ManyToOne(() => Account, account => account.salaries, { onDelete: 'CASCADE' })
    account: Account;
}
