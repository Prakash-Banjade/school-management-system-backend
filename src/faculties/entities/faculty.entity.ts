import { ClassRoom } from "src/class-rooms/entities/class-room.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { EDegreeLevel } from "src/common/types/global.type";
import { Column, Entity, OneToMany } from "typeorm";

@Entity()
export class Faculty extends BaseEntity {

    @Column({ type: 'varchar', unique: true })
    name: string;

    @Column({ type: 'longtext', nullable: true })
    description: string;

    @Column({ type: 'enum', enum: EDegreeLevel })
    degreeLevel: EDegreeLevel;

    @Column({ type: 'int' })
    duration: number; // month

    @OneToMany(() => ClassRoom, classRoom => classRoom.faculty)
    classRooms: ClassRoom[]
}
