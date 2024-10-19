import { BaseEntity } from "src/common/entities/base.entity";
import { DormitoryRoom } from "src/dormitory-system/dormitory-rooms/entities/dormitory-room.entity";
import { Column, Entity, OneToMany } from "typeorm";

@Entity()
export class RoomType extends BaseEntity {
    @Column({ type: 'varchar' })
    name: string;

    @Column({ type: 'longtext', nullable: true })
    description: string;

    @OneToMany(() => DormitoryRoom, dormitoryRoom => dormitoryRoom.roomType)
    dormitoryRooms: DormitoryRoom[];
}
