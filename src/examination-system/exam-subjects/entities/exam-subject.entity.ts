import { BaseEntity } from "src/common/entities/base.entity";
import { ExamReport } from "src/examination-system/exam-reports/entities/exam-report.entity";
import { Exam } from "src/examination-system/exams/entities/exam.entity";
import { Subject } from "src/subjects/entities/subject.entity";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class ExamSubject extends BaseEntity {
    @Column({ type: 'datetime' })
    examDate: string;

    @Column({ type: 'datetime' })
    startTime: string;

    @Column({ type: 'varchar' })
    duration: string;

    @Column({ type: 'int' })
    fullMark: number;

    @Column({ type: 'int' })
    passMark: number;

    @Column({ type: 'varchar', default: 'N' })
    venue: string;

    @ManyToOne(() => Exam, exam => exam.examSubjects, { onDelete: 'CASCADE' })
    exam: Exam;

    @ManyToOne(() => Subject, subject => subject.examSubjects, { onDelete: 'CASCADE' })
    subject: Subject;

    @OneToMany(() => ExamReport, examReport => examReport.examSubject)
    examReports: ExamReport[]
}
