import { BaseEntity } from 'src/common/entities/base.entity';
import { ETaskSubmissionStatus } from 'src/common/types/global.type';
import { File } from 'src/file-management/files/entities/file.entity';
import { Student } from 'src/students/entities/student.entity';
import { Task } from 'src/task-system/tasks/entities/task.entity';
import { Entity, Column, ManyToOne, CreateDateColumn, OneToMany } from 'typeorm';

@Entity()
export class TaskSubmission extends BaseEntity {

    @ManyToOne(() => Task, task => task.submissions, { onDelete: 'CASCADE' })
    task: Task;

    @ManyToOne(() => Student, student => student.taskSubmissions, { onDelete: 'CASCADE' })
    student: Student;

    @Column({ type: 'enum', enum: ETaskSubmissionStatus, default: ETaskSubmissionStatus.Not_Submitted })
    status: ETaskSubmissionStatus;

    @Column({ type: 'text', nullable: true })
    content: string;

    @OneToMany(() => File, file => file.task_submission_attatchment)
    attatchments: File[];

    @CreateDateColumn({ name: 'submission_date' })
    submissionDate: Date;
}
