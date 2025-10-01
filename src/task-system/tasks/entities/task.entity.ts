import { addDays } from "date-fns";
import { Account } from "src/auth-system/accounts/entities/account.entity";
import { ClassRoom } from "src/class-rooms/entities/class-room.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { ETask } from "src/common/types/global.type";
import { File } from "src/file-management/files/entities/file.entity";
import { Subject } from "src/subjects/entities/subject.entity";
import { TaskSubmission } from "src/task-system/task-submissions/entities/task-submission.entity";
import { startOfDayString } from "src/utils/utils";
import { BeforeInsert, BeforeUpdate, Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class Task extends BaseEntity {
    @Column({ type: "varchar" })
    title: string;

    @Column({ type: "longtext" })
    description: string;

    @Column({ type: 'datetime' })
    deadline: string;

    @BeforeInsert()
    @BeforeUpdate()
    setDeadline() {
        if (this.taskType !== ETask.ASSIGNMENT) {
            this.deadline = startOfDayString(addDays(new Date(), 1));
        }
    }

    @Column({ type: 'enum', enum: ETask })
    taskType: ETask;

    @Column({ type: 'int', default: 0 })
    marks: number;

    @OneToMany(() => File, file => file.task_attachment)
    attachments: File[];

    @ManyToOne(() => Account, account => account.tasks, { onDelete: 'SET NULL', nullable: true })
    setBy: Account;

    @ManyToOne(() => Subject, subject => subject.tasks, { onDelete: 'CASCADE', nullable: false })
    subject: Subject;

    @ManyToOne(() => ClassRoom, classRoom => classRoom.tasks, { onDelete: 'CASCADE', nullable: false })
    classRoom: ClassRoom;

    @OneToMany(() => TaskSubmission, taskSubmission => taskSubmission.task)
    submissions: TaskSubmission[];
}
