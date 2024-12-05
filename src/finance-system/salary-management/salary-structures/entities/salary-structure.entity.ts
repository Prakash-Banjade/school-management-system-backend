import { BaseEntity } from "src/common/entities/base.entity";
import { Staff } from "src/staffs/entities/staff.entity";
import { Teacher } from "src/teachers/entities/teacher.entity";
import { BeforeInsert, Column, Entity, JoinColumn, OneToOne } from "typeorm";

export interface IAllowance {
    title: string,
    amount: number
}

@Entity()
export class SalaryStructure extends BaseEntity {
    @OneToOne(() => Teacher, teacher => teacher.salaryStructure, { onDelete: 'CASCADE' })
    @JoinColumn()
    teacher: Teacher;

    @OneToOne(() => Staff, staff => staff.salaryStructure, { onDelete: 'CASCADE' })
    @JoinColumn()
    staff: Staff;

    @Column({ type: 'float' })
    basicSalary: number;

    @Column({ type: 'json' })
    allowances: IAllowance[];

    @Column({ type: 'float' })
    grossSalary: number;

    @BeforeInsert()
    setGrossSalary() {
        this.grossSalary = this.basicSalary;
        this.allowances?.forEach(allowance => {
            this.grossSalary += allowance.amount;
        });
    }
}