import { BaseEntity } from "src/common/entities/base.entity";
import { EDormitoryType } from "src/common/types/global.type";
import { DormitoryRoom } from "src/dormitory-system/dormitory-rooms/entities/dormitory-room.entity";
import { Column, Entity, OneToMany } from "typeorm";

@Entity()
export class Dormitory extends BaseEntity {
    @Column({ type: 'varchar', unique: true })
    name: string;

    @Column({ type: 'enum', enum: EDormitoryType })
    type: EDormitoryType;

    @Column({ type: 'text', nullable: true })
    address: string;

    @Column({ type: 'varchar', nullable: true })
    intake: string;

    @Column({ type: 'longtext', nullable: true })
    description: string;

    @OneToMany(() => DormitoryRoom, dormitoryRoom => dormitoryRoom.dormitory)
    dormitoryRooms: DormitoryRoom[];
}
