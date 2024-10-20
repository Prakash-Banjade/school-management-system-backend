import { AcademicYear } from "src/academic-years/entities/academic-year.entity";
import { ClassRoom } from "src/class-rooms/entities/class-room.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { ExamSubject } from "src/examination-system/exam-subjects/entities/exam-subject.entity";
import { ExamType } from "src/examination-system/exam-types/entities/exam-type.entity";
import { Entity, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class Exam extends BaseEntity {
    @ManyToOne(() => ExamType, examType => examType.exams, { onDelete: 'SET NULL' })
    examType: ExamType;

    @ManyToOne(() => ClassRoom, classRoom => classRoom.exams, { onDelete: 'SET NULL' })
    classRoom: ClassRoom;

    @OneToMany(() => ExamSubject, examSubject => examSubject.exam)
    examSubjects: ExamSubject[]

    @ManyToOne(() => AcademicYear, academicYear => academicYear.exams, { onDelete: 'SET NULL' })
    academicYear: AcademicYear;
}
