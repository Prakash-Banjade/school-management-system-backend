import { BaseEntity } from "src/common/entities/base.entity";
import { Enrollment } from "src/enrollments/entities/enrollment.entity";
import { Exam } from "src/examination-system/exams/entities/exam.entity";
import { Column, Entity, OneToMany } from "typeorm";

@Entity()
export class AcademicYear extends BaseEntity {
    @Column({ type: "datetime" })
    startDate: string;

    @Column({ type: "datetime" })
    endDate: string;

    @Column({ type: 'varchar', default: '' })
    name: string;

    @Column({ type: "boolean", default: false })
    isActive: boolean

    @OneToMany(() => Enrollment, (enrollment) => enrollment.academicYear)
    enrollments: Enrollment[]

    @OneToMany(() => Exam, (exam) => exam.academicYear)
    exams: Exam[]
}
