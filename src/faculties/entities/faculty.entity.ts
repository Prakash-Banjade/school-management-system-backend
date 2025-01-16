import { ClassRoom } from "src/class-rooms/entities/class-room.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity, OneToMany } from "typeorm";

@Entity()
export class Faculty extends BaseEntity {

    @Column({ type: 'varchar', unique: true })
    name: string;

    @Column({ type: 'longtext', nullable: true })
    description: string;

    @OneToMany(() => ClassRoom, classRoom => classRoom.faculty)
    classRooms: ClassRoom[]
}
