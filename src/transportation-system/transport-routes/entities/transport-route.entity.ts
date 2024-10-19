import { BaseEntity } from "src/common/entities/base.entity";
import { Student } from "src/students/entities/student.entity";
import { Vehicle } from "src/transportation-system/vehicles/entities/vehicle.entity";
import { Column, Entity, OneToMany } from "typeorm";

@Entity()
export class TransportRoute extends BaseEntity {
    @Column({ type: 'varchar' })
    title: string;

    @Column({ type: 'real' })
    fare: number;

    @OneToMany(() => Vehicle, (vehicle) => vehicle.transportRoute)
    vehicles: Vehicle[];

    @OneToMany(() => Student, (student) => student.transportRoute)
    students: Student[];
}
