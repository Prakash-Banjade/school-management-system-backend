import { AcademicYear } from "src/academic-years/entities/academic-year.entity";
import { Branch } from "src/branches/entities/branch.entity";
import { ClassRoom } from "src/class-rooms/entities/class-room.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { ExamSubject } from "src/examination-system/exam-subjects/entities/exam-subject.entity";
import { ExamType } from "src/examination-system/exam-types/entities/exam-type.entity";
import { Entity, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class Exam extends BaseEntity {
    @ManyToOne(() => ExamType, examType => examType.exams, { onDelete: 'RESTRICT' })
    examType: ExamType;

    @ManyToOne(() => ClassRoom, classRoom => classRoom.exams, { onDelete: 'CASCADE' })
    classRoom: ClassRoom;

    @OneToMany(() => ExamSubject, examSubject => examSubject.exam, { cascade: true })
    examSubjects: ExamSubject[];

    @ManyToOne(() => AcademicYear, academicYear => academicYear.exams, { onDelete: 'CASCADE' })
    academicYear: AcademicYear;

    @ManyToOne(() => Branch, branch => branch.exams, { onDelete: 'CASCADE' })
    branch: Branch;
}
