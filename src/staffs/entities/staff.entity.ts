import { Account } from "src/auth-system/accounts/entities/account.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { EBloodGroup, EMaritalStatus, EStaff, Gender } from "src/common/types/global.type";
import { Faculty } from "src/faculties/entities/faculty.entity";
import { EmployeeLedger } from "src/finance-system/salary-management/employee-ledgers/entities/employee-ledger.entity";
import { Payroll } from "src/finance-system/salary-management/payrolls/entities/payroll.entity";
import { SalaryStructure } from "src/finance-system/salary-management/salary-structures/entities/salary-structure.entity";
import { Vehicle } from "src/transportation-system/vehicles/entities/vehicle.entity";
import { generateTeacherId } from "src/utils/generate-teacher-id";
import { BeforeInsert, Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, OneToMany, OneToOne } from "typeorm";

@Entity()
export class Staff extends BaseEntity {
    @Index({ unique: true })
    @Column({ type: 'int' })
    staffId: number;

    @BeforeInsert()
    generateTeacherId() {
        if (!this.staffId) this.staffId = generateTeacherId();
    }

    @Column({ type: 'varchar' })
    firstName: string;

    @Column({ type: 'varchar', default: '' })
    lastName?: string;

    @Column({ type: 'enum', enum: Gender })
    gender: Gender

    @Column({ type: 'varchar', unique: true })
    email: string

    @Column({ type: 'varchar' })
    phone: string

    @Column({ type: 'datetime' })
    dob: string;

    @OneToOne(() => Account, account => account.staff, { onDelete: "CASCADE" })
    @JoinColumn()
    account: Account;

    @Column({ type: 'enum', enum: EStaff })
    type: EStaff;

    @ManyToMany(() => Faculty, faculty => faculty.staffs)
    @JoinTable()
    faculties: Faculty[]; // this will define the department of the staff

    @Column({ type: 'longtext', nullable: true })
    shortDescription?: string;

    @Column({ type: 'enum', enum: EMaritalStatus })
    maritalStatus: EMaritalStatus

    @Column({ type: 'varchar' })
    qualification: string;

    @Column({ type: 'enum', enum: EBloodGroup })
    bloodGroup: EBloodGroup

    @Column({ type: 'datetime' })
    joinedDate: string

    @Column({ type: 'varchar', nullable: true })
    bankName: string;

    @Column({ type: 'varchar', nullable: true })
    accountName: string

    @Column({ type: 'varchar', nullable: true })
    accountNumber: string;

    @OneToOne(() => SalaryStructure, (salaryStructure) => salaryStructure.staff, { cascade: true })
    salaryStructure: SalaryStructure;

    @OneToMany(() => Payroll, (payroll) => payroll.staff)
    payrolls: Payroll[];

    @OneToMany(() => EmployeeLedger, (employeeLedger) => employeeLedger.staff)
    ledgers: EmployeeLedger[];

    @Column({ type: 'float', default: 0 })
    payAmount: number; // used to keep track of ledger amount

    setPayAmount(amount: number) {
        this.payAmount += amount;
    }

    /**
    |--------------------------------------------------
    | FOR DRIVER STAFF
    |--------------------------------------------------
    */
    @OneToMany(() => Vehicle, vehicle => vehicle.driver)
    vehicles: Vehicle[]
}
