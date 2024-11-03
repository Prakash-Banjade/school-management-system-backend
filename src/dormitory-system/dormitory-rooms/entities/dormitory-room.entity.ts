import { BaseEntity } from "src/common/entities/base.entity";
import { Dormitory } from "src/dormitory-system/dormitories/entities/dormitory.entity";
import { RoomType } from "src/dormitory-system/room-types/entities/room-type.entity";
import { Student } from "src/students/entities/student.entity";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class DormitoryRoom extends BaseEntity {
    @Column({ type: 'varchar' })
    name: string;

    @Column({ type: 'int', unique: true })
    roomNumber: number

    @Column({ type: 'int' })
    noOfBeds: number

    @Column({ type: 'real' })
    costPerBed: number

    @Column({ type: 'longtext', nullable: true })
    description: string

    @ManyToOne(() => Dormitory, (dormitory) => dormitory.dormitoryRooms, { onDelete: 'CASCADE', nullable: false })
    dormitory: Dormitory

    @ManyToOne(() => RoomType, (roomType) => roomType.dormitoryRooms, { onDelete: 'CASCADE', nullable: false })
    roomType: RoomType

    @OneToMany(() => Student, student => student.dormitoryRoom)
    students: Student[]
}
