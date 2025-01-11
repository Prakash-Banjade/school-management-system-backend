import { ClassRoom } from "src/class-rooms/entities/class-room.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { Subject } from "src/subjects/entities/subject.entity";
import { Teacher } from "src/teachers/entities/teacher.entity";
import { Column, Entity, ManyToOne } from "typeorm";

export enum EOnlineClassStatus {
    Scheduled = 'Scheduled',
    Live = 'Live',
    Completed = 'Completed',
    Cancelled = 'Cancelled'
}

@Entity()
export class OnlineClass extends BaseEntity {
    @Column({ type: 'varchar' })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @ManyToOne(() => ClassRoom, classRoom => classRoom.onlineClasses, { onDelete: 'CASCADE', nullable: false })
    classRoom: ClassRoom;

    @ManyToOne(() => Teacher, teacher => teacher.onlineClasses, { onDelete: 'CASCADE', nullable: false })
    teacher: Teacher;

    @ManyToOne(() => Subject, subject => subject.onlineClasses, { onDelete: 'CASCADE', nullable: false })
    subject: Subject;

    @Column({ type: 'enum', enum: EOnlineClassStatus, default: EOnlineClassStatus.Scheduled })
    status: EOnlineClassStatus;

    @Column({ type: 'datetime', nullable: true })
    scheduledAt: string;

    @Column({ type: 'varchar' })
    joinLink: string;
}
