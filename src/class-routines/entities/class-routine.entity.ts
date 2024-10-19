import { ClassRoom } from "src/class-rooms/entities/class-room.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { EDayOfWeek, ERoutineType } from "src/common/types/global.type";
import { Subject } from "src/subjects/entities/subject.entity";
import { Column, Entity, ManyToOne } from "typeorm";

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

    @ManyToOne(() => ClassRoom, (classRoom) => classRoom.classRoutines)
    classRoom: ClassRoom;

    @ManyToOne(() => Subject, (subject) => subject.classRoutines)
    subject: Subject;
}
