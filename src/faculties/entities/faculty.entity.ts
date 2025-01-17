import { ClassRoom } from "src/class-rooms/entities/class-room.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { Teacher } from "src/teachers/entities/teacher.entity";
import { Column, Entity, ManyToMany, OneToMany } from "typeorm";

@Entity()
export class Faculty extends BaseEntity {

    @Column({ type: 'varchar', unique: true })
    name: string;

    @Column({ type: 'longtext', nullable: true })
    description: string;

    @OneToMany(() => ClassRoom, classRoom => classRoom.faculty)
    classRooms: ClassRoom[];

    @ManyToMany(() => Teacher, teacher => teacher.faculties)
    teachers: Teacher[];
}
