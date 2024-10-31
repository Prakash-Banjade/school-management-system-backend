import { BaseEntity } from "src/common/entities/base.entity";
import { TaskSubmission } from "src/task-system/task-submissions/entities/task-submission.entity";
import { Task } from "src/task-system/tasks/entities/task.entity";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity()
export class File extends BaseEntity {
    @Column({ type: 'varchar' })
    url!: string

    @Column({ type: 'varchar' })
    memeType!: string

    @Column({ type: 'varchar' })
    format!: string

    @Column({ type: 'int' })
    size!: number

    @Column({ type: 'varchar' })
    originalName!: string

    @Column({ type: 'varchar', default: '' })
    name!: string

    /**
    |--------------------------------------------------
    | RELATIONS
    |--------------------------------------------------
    */


    @ManyToOne(() => Task, task => task.attatchments, { onDelete: 'CASCADE' })
    task_attatchment: Task;

    @ManyToOne(() => TaskSubmission, taskSubmission => taskSubmission.attatchments, { onDelete: 'CASCADE' })
    task_submission_attatchment: TaskSubmission;
}
