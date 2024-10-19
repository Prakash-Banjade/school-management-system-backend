import { BaseEntity } from "src/common/entities/base.entity";
import { Dormitory } from "src/dormitory-system/dormitories/entities/dormitory.entity";
import { RoomType } from "src/dormitory-system/room-types/entities/room-type.entity";
import { Student } from "src/students/entities/student.entity";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class DormitoryRoom extends BaseEntity {
    @Column({ type: 'int' })
    roomNumber: number

    @Column({ type: 'int' })
    noOfBeds: number

    @Column({ type: 'real' })
    costPerBed: number

    @Column({ type: 'longtext', nullable: true })
    description: string

    @ManyToOne(() => Dormitory, (dormitory) => dormitory.dormitoryRooms)
    dormitory: Dormitory

    @ManyToOne(() => RoomType, (roomType) => roomType.dormitoryRooms)
    roomType: RoomType

    @OneToMany(() => Student, student => student.dormitoryRoom)
    students: Student[]
}
