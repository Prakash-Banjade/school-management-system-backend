import { Account } from "src/auth-system/accounts/entities/account.entity";
import { ClassRoom } from "src/class-rooms/entities/class-room.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { File } from "src/file-management/files/entities/file.entity";
import { Subject } from "src/subjects/entities/subject.entity";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class LessonPlan extends BaseEntity {
    @Column({ type: 'datetime' })
    startDate: string;

    @Column({ type: 'datetime' })
    endDate: string;

    @Column({ type: 'varchar' })
    title: string;

    @Column({ type: 'longtext' })
    description: string;

    @ManyToOne(() => Subject, subject => subject.lessonPlans, { onDelete: 'CASCADE' })
    subject: Subject;

    @ManyToMany(() => ClassRoom, classRoom => classRoom.lessonPlans, { onDelete: 'CASCADE' })
    @JoinTable()
    classRooms: ClassRoom[];

    @ManyToOne(() => Account, account => account.createdLessonPlans, { onDelete: 'SET NULL' })
    createdBy: Account;

    @OneToMany(() => File, file => file.lessonPlan_attachments)
    attachments: File[];
}



