import { BaseEntity } from "src/common/entities/base.entity";
import { Exam } from "src/examination-system/exams/entities/exam.entity";
import { Column, Entity, OneToMany } from "typeorm";

@Entity()
export class ExamType extends BaseEntity {
    @Column({ type: 'varchar' })
    name: string;

    @Column({ type: 'longtext', nullable: true })
    description: string;

    @OneToMany(() => Exam, exam => exam.examType)
    exams: Exam[]
}
