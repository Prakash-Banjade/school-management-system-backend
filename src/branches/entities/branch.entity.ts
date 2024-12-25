import { Account } from "src/auth-system/accounts/entities/account.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { DormitoryRoom } from "src/dormitory-system/dormitory-rooms/entities/dormitory-room.entity";
import { Exam } from "src/examination-system/exams/entities/exam.entity";
import { LibraryBook } from "src/library-system/library-book/entities/library-book.entity";
import { RouteStop } from "src/transportation-system/route-stops/entities/route-stop.entity";
import { Vehicle } from "src/transportation-system/vehicles/entities/vehicle.entity";
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

    @OneToMany(() => Exam, exam => exam.branch)
    exams: Exam[];

    @OneToMany(() => Vehicle, vehicle => vehicle.branch)
    vehicles: Vehicle[]

    @OneToMany(() => RouteStop, routeStop => routeStop.branch)
    routeStops: RouteStop[]

    @OneToMany(() => LibraryBook, libraryBook => libraryBook.branch)
    libraryBooks: LibraryBook[]
}
