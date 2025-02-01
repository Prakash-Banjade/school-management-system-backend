import { Account } from "src/auth-system/accounts/entities/account.entity";
import { ClassRoom } from "src/class-rooms/entities/class-room.entity";
import { ClassRoutine } from "src/class-routines/entities/class-routine.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { EBloodGroup, EMaritalStatus, Gender } from "src/common/types/global.type";
import { Faculty } from "src/faculties/entities/faculty.entity";
import { EmployeeLedger } from "src/finance-system/salary-management/employee-ledgers/entities/employee-ledger.entity";
import { Payroll } from "src/finance-system/salary-management/payrolls/entities/payroll.entity";
import { SalaryStructure } from "src/finance-system/salary-management/salary-structures/entities/salary-structure.entity";
import { OnlineClass } from "src/online-classes/entities/online-class.entity";
import { Subject } from "src/subjects/entities/subject.entity";
import { TaskEvaluation } from "src/task-system/task-evaluations/entities/task-evaluation.entity";
import { generateTeacherId } from "src/utils/generate-teacher-id";
import { BeforeInsert, Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, OneToMany, OneToOne } from "typeorm";

@Entity()
export class Teacher extends BaseEntity {
    @Index({ unique: true })
    @Column({ type: 'int', unique: true })
    teacherId: number;

    @BeforeInsert()
    generateTeacherId() {
        if (!this.teacherId) this.teacherId = generateTeacherId();
    }

    @Column({ type: 'varchar' })
    firstName: string;

    @Column({ type: 'varchar', default: '' })
    lastName?: string;

    @OneToOne(() => Account, account => account.teacher, { onDelete: 'CASCADE' })
    @JoinColumn()
    account: Account;

    @ManyToMany(() => Faculty, faculty => faculty.teachers)
    @JoinTable()
    faculties: Faculty[]; // this will define the department of the teacher

    @Column({ type: 'enum', enum: Gender })
    gender: Gender

    @Column({ type: 'varchar', unique: true })
    email: string

    @Column({ type: 'varchar' })
    phone: string

    @Column({ type: 'datetime' })
    dob: string;

    @OneToMany(() => ClassRoom, (classRoom) => classRoom.classTeacher)
    assignedClassRooms: ClassRoom[];

    @Column({ type: 'longtext', nullable: true })
    shortDescription?: string;

    @Column({ type: 'enum', enum: EMaritalStatus })
    maritalStatus: EMaritalStatus

    @Column({ type: 'varchar' })
    qualification: string;

    @Column({ type: 'enum', enum: EBloodGroup })
    bloodGroup: EBloodGroup;

    @Column({ type: 'datetime' })
    joinedDate: string

    @Column({ type: 'varchar' })
    bankName: string;

    @Column({ type: 'varchar' })
    accountName: string

    @Column({ type: 'varchar' })
    accountNumber: string

    @ManyToMany(() => Subject, (subject) => subject.teachers)
    assignedSubjects: Subject[]

    @OneToMany(() => OnlineClass, onlineClass => onlineClass.teacher)
    onlineClasses: OnlineClass[];

    @OneToMany(() => ClassRoutine, (classRoutine) => classRoutine.teacher)
    classRoutines: ClassRoutine[]

    @OneToMany(() => TaskEvaluation, (taskEvaluation) => taskEvaluation.evaluator)
    taskEvaluations: TaskEvaluation[];

    @OneToOne(() => SalaryStructure, (salaryStructure) => salaryStructure.teacher, { cascade: true })
    salaryStructure: SalaryStructure;

    @OneToMany(() => Payroll, (payroll) => payroll.teacher)
    payrolls: Payroll[];

    @OneToMany(() => EmployeeLedger, (employeeLedger) => employeeLedger.teacher)
    ledgers: EmployeeLedger[];

    @Column({ type: 'float', default: 0 })
    payAmount: number; // used to keep track of ledger amount

    setPayAmount(amount: number) {
        this.payAmount += amount;
    }
}
