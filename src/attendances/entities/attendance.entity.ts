import { Account } from "src/auth-system/accounts/entities/account.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { EAttendanceStatus } from "src/common/types/global.type";
import { Column, Entity, ManyToOne, Unique, } from "typeorm";

@Entity()
@Unique(['account', 'date'])
export class Attendance extends BaseEntity {
    @Column({ type: 'enum', enum: EAttendanceStatus, nullable: true })
    status: EAttendanceStatus | null;

    @ManyToOne(() => Account, (account) => account.attendances, { onDelete: 'CASCADE' })
    account: Account

    @Column({ type: 'datetime' })
    date: string;

    @Column({ type: 'varchar', nullable: true })
    inTime: string | null;

    @Column({ type: 'varchar', nullable: true })
    outTime: string | null;
}
