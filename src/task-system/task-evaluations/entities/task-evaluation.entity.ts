import { BaseEntity } from "src/common/entities/base.entity";
import { TaskSubmission } from "src/task-system/task-submissions/entities/task-submission.entity";
import { Teacher } from "src/teachers/entities/teacher.entity";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity()
export class TaskEvaluation extends BaseEntity {

    @ManyToOne(() => TaskSubmission, submission => submission.evaluations, { onDelete: 'CASCADE' })
    submission: TaskSubmission;

    @ManyToOne(() => Teacher, teacher => teacher.taskEvaluations, { onDelete: 'SET NULL' })
    evaluator: Teacher;

    @Column({ type: 'float' })
    score: number;

    @Column({ type: 'text', nullable: true })
    feedback: string;
}
