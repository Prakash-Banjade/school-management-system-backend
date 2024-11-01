import { Account } from "src/auth-system/accounts/entities/account.entity";
import { ClassRoom } from "src/class-rooms/entities/class-room.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { ETask } from "src/common/types/global.type";
import { File } from "src/file-management/files/entities/file.entity";
import { Subject } from "src/subjects/entities/subject.entity";
import { TaskSubmission } from "src/task-system/task-submissions/entities/task-submission.entity";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class Task extends BaseEntity {
    @Column({ type: "varchar" })
    title: string;

    @Column({ type: "longtext" })
    description: string;

    @Column({ type: 'datetime' })
    deadline: string;

    @Column({ type: 'enum', enum: ETask })
    taskType: ETask;

    @Column({ type: 'int', nullable: true })
    marks: number;

    @OneToMany(() => File, file => file.task_attachment)
    attachments: File[];

    @ManyToOne(() => Account, account => account.tasks, { onDelete: 'SET NULL' })
    setBy: Account;

    @ManyToOne(() => Subject, subject => subject.tasks, { onDelete: 'CASCADE', nullable: false })
    subject: Subject;

    @ManyToMany(() => ClassRoom, classRoom => classRoom.tasks, { onDelete: 'CASCADE' })
    @JoinTable()
    classRooms: ClassRoom[];

    @OneToMany(() => TaskSubmission, taskSubmission => taskSubmission.task)
    submissions: TaskSubmission[];
}
