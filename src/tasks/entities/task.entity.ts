import { Account } from "src/auth-system/accounts/entities/account.entity";
import { ClassRoom } from "src/class-rooms/entities/class-room.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { ETask } from "src/common/types/global.type";
import { Image } from "src/file-management/images/entities/image.entity";
import { Subject } from "src/subjects/entities/subject.entity";
import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class Task extends BaseEntity {
    @Column({ type: "varchar" })
    title: string;

    @Column({ type: "longtext" })
    description: string;

    @Column({ type: 'datetime' })
    submissionDate: string;

    @Column({ type: 'enum', enum: ETask })
    taskType: ETask;

    @Column({ type: 'int', nullable: true })
    marks: number;

    @OneToMany(() => Image, image => image.task_attatchments)
    attatchments: Image[];

    @ManyToOne(() => Account, account => account.tasks, { onDelete: 'SET NULL' })
    setBy: Account;

    @ManyToOne(() => Subject, subject => subject.tasks, { onDelete: 'CASCADE' })
    subject: Subject;

    @ManyToMany(() => ClassRoom, classRoom => classRoom.tasks, { onDelete: 'CASCADE' })
    @JoinColumn()
    classRooms: ClassRoom[];
}
