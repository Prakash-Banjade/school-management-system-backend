import { ClassRoom } from "src/class-rooms/entities/class-room.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { Student } from "src/students/entities/student.entity";
import { Subject } from "src/subjects/entities/subject.entity";
import { Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToOne } from "typeorm";

@Entity()
export class OptionalSubject extends BaseEntity {
    @ManyToMany(() => Student, (student) => student.optionalSubjects, { onDelete: 'CASCADE' })
    @JoinTable()
    students: Student[];

    @OneToOne(() => Subject, (subject) => subject.optionalSubject, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn()
    subject: Subject;

    @ManyToOne(() => ClassRoom, (classroom) => classroom.optionalSubjects, { onDelete: 'CASCADE' })
    classRoom: ClassRoom;
}
