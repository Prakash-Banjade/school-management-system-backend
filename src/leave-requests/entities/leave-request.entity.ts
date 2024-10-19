import { BaseEntity } from "src/core/entities/base.entity";
import { ELeaveRequestStatus } from "src/core/types/global.types";
import { User } from "src/users/entities/user.entity";
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
