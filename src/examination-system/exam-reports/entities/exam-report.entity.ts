import { BaseEntity } from "src/common/entities/base.entity";
import { ExamSubject } from "src/examination-system/exam-subjects/entities/exam-subject.entity";
import { Student } from "src/students/entities/student.entity";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity()
export class ExamReport extends BaseEntity {
    @ManyToOne(() => ExamSubject, (examSubject) => examSubject.examReports, { nullable: false, onDelete: 'CASCADE' })
    examSubject: ExamSubject

    @ManyToOne(() => Student, (student) => student.examReports, { onDelete: 'CASCADE' })
    student: Student

    @Column({ type: 'float', precision: 10, scale: 2 })
    theoryOM!: number; 

    @Column({ type: 'float', precision: 10, scale: 2 })
    practicalOM!: number; 

    @Column({ type: 'float', precision: 10, scale: 2 })
    percentage: number;

    @Column({ type: 'float', precision: 10, scale: 2 })
    gpa: number;

    @Column({ type: 'varchar' })
    grade: string;
}
