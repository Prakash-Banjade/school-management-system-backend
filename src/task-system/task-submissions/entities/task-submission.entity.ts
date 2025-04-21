import { BaseEntity } from 'src/common/entities/base.entity';
import { ETaskSubmissionStatus } from 'src/common/types/global.type';
import { File } from 'src/file-management/files/entities/file.entity';
import { Student } from 'src/students/entities/student.entity';
import { TaskEvaluation } from 'src/task-system/task-evaluations/entities/task-evaluation.entity';
import { Task } from 'src/task-system/tasks/entities/task.entity';
import { Entity, Column, ManyToOne, OneToMany, OneToOne, Unique } from 'typeorm';

@Entity()
@Unique(['task', 'student'])
export class TaskSubmission extends BaseEntity {

    @ManyToOne(() => Task, task => task.submissions, { onDelete: 'CASCADE' })
    task: Task;

    @ManyToOne(() => Student, student => student.taskSubmissions, { onDelete: 'CASCADE', nullable: false })
    student: Student;

    @Column({ type: 'enum', enum: ETaskSubmissionStatus, default: ETaskSubmissionStatus.Not_Submitted })
    status: ETaskSubmissionStatus;

    @Column({ type: 'text' })
    note: string;

    @OneToMany(() => File, file => file.task_submission_attachment)
    attachments: File[];

    @OneToOne(() => TaskEvaluation, evaluation => evaluation.submission)
    evaluation: TaskEvaluation;
}
