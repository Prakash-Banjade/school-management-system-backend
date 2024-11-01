import { Account } from "src/auth-system/accounts/entities/account.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { EBloodGroup, EMaritalStatus, Gender } from "src/common/types/global.type";
import { Image } from "src/file-management/images/entities/image.entity";
import { Subject } from "src/subjects/entities/subject.entity";
import { TaskEvaluation } from "src/task-system/task-evaluations/entities/task-evaluation.entity";
import { generateTeacherId } from "src/utils/generate-teacher-id";
import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";

@Entity()
export class Teacher extends BaseEntity {
    @Column({ type: 'int' })
    teacherId: number;

    @BeforeInsert()
    @BeforeUpdate()
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

    @Column({ type: 'enum', enum: Gender })
    gender: Gender

    @Column({ type: 'varchar' })
    email: string

    @Column({ type: 'varchar' })
    phone: string

    @Column({ type: 'datetime' })
    dob: string;

    @Column({ type: 'real' })
    wage: number

    @OneToOne(() => Image, image => image.teacher_profileImage, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    profileImage?: Image;

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

    @OneToMany(() => Subject, (subject) => subject.teacher)
    assignedSubjects: Subject[]

    @OneToMany(() => TaskEvaluation, (taskEvaluation) => taskEvaluation.evaluator)
    taskEvaluations: TaskEvaluation[]
}
