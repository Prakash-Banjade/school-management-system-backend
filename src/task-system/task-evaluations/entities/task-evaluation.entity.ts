import { BaseEntity } from "src/common/entities/base.entity";
import { TaskSubmission } from "src/task-system/task-submissions/entities/task-submission.entity";
import { Teacher } from "src/teachers/entities/teacher.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from "typeorm";

@Entity()
export class TaskEvaluation extends BaseEntity {

    @OneToOne(() => TaskSubmission, submission => submission.evaluation, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn()
    submission: TaskSubmission;

    @ManyToOne(() => Teacher, teacher => teacher.taskEvaluations, { onDelete: 'SET NULL' })
    evaluator: Teacher;

    @Column({ type: 'float', default: 0 })
    score: number;

    @Column({ type: 'text', nullable: true })
    feedback: string;
}
