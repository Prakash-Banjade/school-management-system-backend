import { BaseEntity } from "src/common/entities/base.entity";
import { EAttendanceStatus } from "src/common/types/global.type";
import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, } from "typeorm";

@Entity()
export class Attendance extends BaseEntity {
    @Column({ type: 'enum', enum: EAttendanceStatus })
    status: EAttendanceStatus

    @ManyToOne(() => User, (user) => user.attendances, { onDelete: 'CASCADE' })
    user: User

    @Column({ type: 'datetime' })
    date: string;

    @BeforeInsert()
    @BeforeUpdate()
    setDate() {
        if (!this.date) this.date = new Date().toISOString();
    }

    @Column({ type: 'datetime', nullable: true })
    inTime: string;

    @Column({ type: 'datetime', nullable: true })
    outTime: string;
}
