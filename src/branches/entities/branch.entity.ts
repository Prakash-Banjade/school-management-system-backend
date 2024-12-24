import { Account } from "src/auth-system/accounts/entities/account.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { DormitoryRoom } from "src/dormitory-system/dormitory-rooms/entities/dormitory-room.entity";
import { Column, Entity, OneToMany } from "typeorm";

@Entity()
export class Branch extends BaseEntity {
    @Column({ type: 'varchar', unique: true })
    name: string;

    @Column({ type: 'text' })
    address: string;

    @Column({ type: 'longtext', nullable: true })
    description: string | null;

    @OneToMany(() => Account, account => account.branch)
    accounts: Account[];


    @OneToMany(() => DormitoryRoom, dormitoryRoom => dormitoryRoom.branch)
    dormitoryRooms: DormitoryRoom[];


}
