import { AcademicYear } from "src/academic-years/entities/academic-year.entity";
import { ClassRoom } from "src/class-rooms/entities/class-room.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { StudentLedger } from "src/finance-system/fee-management/student-ledgers/entities/student-ledger.entity";
import { Student } from "src/students/entities/student.entity";
import { Column, Entity, ManyToOne, OneToOne } from "typeorm";

@Entity()
export class Enrollment extends BaseEntity {
    @Column({ type: 'varchar', length: 255 })
    registrationNumber: string;

    @ManyToOne(() => Student, (student) => student.enrollments, { onDelete: 'CASCADE' })
    student: Student;

    @ManyToOne(() => ClassRoom, (classRoom) => classRoom.enrollments, { onDelete: 'CASCADE' })
    classRoom: ClassRoom;

    @ManyToOne(() => AcademicYear, (academicYear) => academicYear.enrollments, { onDelete: 'CASCADE' })
    academicYear: AcademicYear;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    enrollmentDate: string;

    @Column({ type: 'int', default: 1 })
    rollNo: number;

    @OneToOne(() => StudentLedger, studentLedger => studentLedger.enrollment, { cascade: true })
    ledger: StudentLedger;

    /**
     * this column tracks the charge heads that are to be charged only once in an enrollment, so in invoice form, charge heads are filtered accordingly
     */
    @Column({ type: 'simple-array', nullable: true })
    oneTimeChargeIds: string[];
}
