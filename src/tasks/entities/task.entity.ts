import { Account } from "src/auth-system/accounts/entities/account.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { ETask } from "src/common/types/global.type";
import { Image } from "src/file-management/images/entities/image.entity";
import { Subject } from "src/subjects/entities/subject.entity";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class Task extends BaseEntity {
    @Column({ type: "varchar" })
    title: string;

    @Column({ type: "longtext" })
    description: string;

    @Column({ type: 'datetime' })
    submissionDate: string

    @Column({ type: 'enum', enum: ETask })
    taskType: ETask;

    @Column({ type: 'int', nullable: true })
    marks: number;

    // TODO: AVAILABLE FOR COLUMN: admin | student | all students

    @OneToMany(() => Image, image => image.task_attatchments, { nullable: true, eager: true })
    attatchments: Image[];

    @ManyToOne(() => Account, account => account.tasks, { onDelete: 'SET NULL' })
    setBy: Account;

    @ManyToOne(() => Subject, subject => subject.tasks, { onDelete: 'CASCADE' })
    subject: Subject;

}
