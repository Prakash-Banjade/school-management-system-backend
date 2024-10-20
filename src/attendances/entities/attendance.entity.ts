import { Account } from "src/auth-system/accounts/entities/account.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { EAttendanceStatus } from "src/common/types/global.type";
import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, } from "typeorm";

@Entity()
export class Attendance extends BaseEntity {
    @Column({ type: 'enum', enum: EAttendanceStatus })
    status: EAttendanceStatus

    @ManyToOne(() => Account, (account) => account.attendances, { onDelete: 'CASCADE' })
    account: Account

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
