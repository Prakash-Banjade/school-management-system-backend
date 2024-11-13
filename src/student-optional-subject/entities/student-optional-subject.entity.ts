import { ClassRoom } from "src/class-rooms/entities/class-room.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { Student } from "src/students/entities/student.entity";
import { Subject } from "src/subjects/entities/subject.entity";
import { Entity, ManyToOne } from "typeorm";

@Entity()
export class StudentOptionalSubject extends BaseEntity {
    @ManyToOne(() => Student, (student) => student.optionalSubjects, { onDelete: 'CASCADE' })
    student: Student;

    @ManyToOne(() => Subject, (subject) => subject.students, { nullable: false, onDelete: 'CASCADE' })
    subject: Subject;

    @ManyToOne(() => ClassRoom, (classroom) => classroom.optionalSubjects, { onDelete: 'CASCADE' })
    classroom: ClassRoom;
}
