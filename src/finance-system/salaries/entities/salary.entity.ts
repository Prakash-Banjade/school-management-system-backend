import { BaseEntity } from "src/core/entities/base.entity";
import { ESalaryStatus } from "src/core/types/global.types";
import { generateTeacherId } from "src/core/utils/generate-teacher-id";
import { User } from "src/users/entities/user.entity";
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

    @ManyToOne(() => User, user => user.salaries, { onDelete: 'CASCADE' })
    user: User
}
