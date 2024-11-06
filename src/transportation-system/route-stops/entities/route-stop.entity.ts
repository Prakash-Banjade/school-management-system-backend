import { BaseEntity } from "src/common/entities/base.entity";
import { Student } from "src/students/entities/student.entity";
import { Vehicle } from "src/transportation-system/vehicles/entities/vehicle.entity";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class RouteStop extends BaseEntity {
    @Column({ type: 'varchar' })
    name: string;

    @Column({ type: 'varchar' })
    location: string;

    @Column({ type: 'real' })
    fare: number;

    @Column({ type: 'int' })
    sequence: number;

    @Column({ type: 'varchar' })
    pickUpTime: string;

    @Column({ type: 'real' })
    distance: number;

    @Column({ type: 'varchar' })
    dropOffTime: string;

    @ManyToOne(() => Vehicle, (vehicle) => vehicle.stops, { onDelete: 'SET NULL' })
    vehicle: Vehicle;

    @OneToMany(() => Student, (student) => student.routeStop)
    students: Student[];
}
