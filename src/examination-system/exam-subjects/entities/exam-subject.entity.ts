import { BaseEntity } from "src/common/entities/base.entity";
import { ExamReport } from "src/examination-system/exam-reports/entities/exam-report.entity";
import { Exam } from "src/examination-system/exams/entities/exam.entity";
import { Subject } from "src/subjects/entities/subject.entity";
import { Column, Entity, ManyToOne, OneToMany, Unique } from "typeorm";

@Entity()
@Unique(['exam', 'subject'])
export class ExamSubject extends BaseEntity {
    @Column({ type: 'datetime' })
    examDate: string;

    @Column({ type: 'varchar' })
    startTime: string;

    @Column({ type: 'real' }) // in minutes
    duration: number;

    @Column({ type: 'int' })
    theoryPM: number;

    @Column({ type: 'int' })
    theoryFM: number;

    @Column({ type: 'int' })
    practicalPM: number;

    @Column({ type: 'int' })
    practicalFM: number;

    @Column({ type: 'varchar' })
    venue: string;

    @ManyToOne(() => Exam, exam => exam.examSubjects, { onDelete: 'CASCADE' })
    exam: Exam;

    @ManyToOne(() => Subject, subject => subject.examSubjects, { onDelete: 'CASCADE', nullable: false })
    subject: Subject;

    @OneToMany(() => ExamReport, examReport => examReport.examSubject)
    examReports: ExamReport[]
}
