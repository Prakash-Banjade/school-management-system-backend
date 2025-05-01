import { AcademicYear } from "src/academic-years/entities/academic-year.entity";
import { ClassRoom } from "src/class-rooms/entities/class-room.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { ExamSubject } from "src/examination-system/exam-subjects/entities/exam-subject.entity";
import { ExamType } from "src/examination-system/exam-types/entities/exam-type.entity";
import { Column, Entity, Index, ManyToOne, OneToMany, Unique } from "typeorm";

@Entity()
@Unique(['examType', 'classRoom', 'academicYear'])
export class Exam extends BaseEntity {
    @ManyToOne(() => ExamType, examType => examType.exams, { onDelete: 'RESTRICT', nullable: false })
    examType: ExamType;

    @ManyToOne(() => ClassRoom, classRoom => classRoom.exams, { onDelete: 'CASCADE', nullable: false })
    classRoom: ClassRoom;

    @OneToMany(() => ExamSubject, examSubject => examSubject.exam, { cascade: true })
    examSubjects: ExamSubject[];

    @ManyToOne(() => AcademicYear, academicYear => academicYear.exams, { onDelete: 'CASCADE', nullable: false })
    academicYear: AcademicYear;

    @Index()
    @Column({ type: 'datetime', nullable: false })
    startingFrom: string;

    @Index()
    @Column({ type: 'datetime', nullable: false })
    endsOn: string;

    @Column({ type: 'boolean', default: false })
    isReportPublished: boolean;
}
