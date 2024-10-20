import { User } from "src/auth-system/users/entities/user.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { ELeaveRequestStatus } from "src/common/types/global.type";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity()
export class LeaveRequest extends BaseEntity {
    @ManyToOne(() => User, user => user.leaveRequests)
    user: User

    @Column({ type: "datetime" })
    leaveFrom: string;

    @Column({ type: "datetime" })
    leaveTo: string;

    @Column({ type: "text" })
    title: string;

    @Column({ type: "longtext" })
    description: string;

    @Column({ type: 'enum', enum: ELeaveRequestStatus, default: ELeaveRequestStatus.PENDING })
    status: ELeaveRequestStatus;
}
