import { BaseEntity } from "src/common/entities/base.entity";
import { Exam } from "src/examination-system/exams/entities/exam.entity";
import { Student } from "src/students/entities/student.entity";
import { Column, Entity, Index, ManyToOne } from "typeorm";

@Entity()
export class ExamResult extends BaseEntity {
    @ManyToOne(() => Exam, exam => exam.examResults, { nullable: false, onDelete: 'CASCADE' })
    exam: Exam;

    @ManyToOne(() => Student, student => student.examResults, { nullable: false, onDelete: 'CASCADE' })
    student: Student;
    
    @Index()
    @Column({ type: 'float', precision: 10, scale: 2 })
    percentage: number;

    @Column({ type: 'float', precision: 10, scale: 2 })
    gpa: number;

    @Column({ type: 'varchar' })
    grade: string;

    @Column({ type: 'int' })
    failedSubjectsCount: number;

    @Column({ type: 'simple-array' })
    weakSubjects: string[];
}
