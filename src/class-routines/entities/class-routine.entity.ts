import { ClassRoom } from "src/class-rooms/entities/class-room.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { EDayOfWeek, ERoutineType } from "src/common/types/global.type";
import { Subject } from "src/subjects/entities/subject.entity";
import { Teacher } from "src/teachers/entities/teacher.entity";
import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne } from "typeorm";

@Entity()
export class ClassRoutine extends BaseEntity {
    @Column({ type: 'enum', enum: EDayOfWeek })
    dayOfTheWeek: EDayOfWeek;

    @Column({ type: 'varchar', length: 10 })
    startTime: string;

    @Column({ type: 'varchar', length: 10 })
    endTime: string;

    @Column({ type: 'enum', enum: ERoutineType, default: ERoutineType.CLASS })
    type: ERoutineType;

    @ManyToOne(() => ClassRoom, (classRoom) => classRoom.classRoutines, { onDelete: 'CASCADE', nullable: false })
    classRoom: ClassRoom;

    @ManyToOne(() => Subject, (subject) => subject.classRoutines, { onDelete: 'CASCADE' })
    subject: Subject;

    @ManyToOne(() => Teacher, (teacher) => teacher.classRoutines, { onDelete: 'SET NULL' })
    teacher: Teacher;

    @BeforeInsert()
    @BeforeUpdate()
    refineSubjectWithType() {
        if (this.type === ERoutineType.BREAK) {
            this.subject = null
        };
    }
}
