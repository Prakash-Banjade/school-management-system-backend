import { Branch } from "src/branches/entities/branch.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { EVehicleType } from "src/common/types/global.type";
import { Staff } from "src/staffs/entities/staff.entity";
import { RouteStop } from "src/transportation-system/route-stops/entities/route-stop.entity";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class Vehicle extends BaseEntity {
    @Column({ type: 'varchar' })
    vehicleNumber: string;

    @Column({ type: 'enum', enum: EVehicleType })
    type: EVehicleType;

    @Column({ type: 'varchar' })
    vehicleModel: string;

    @Column({ type: 'int' })
    capacity: number;

    @Column({ type: 'int' })
    yearMade: number;

    @Column({ type: 'longtext', nullable: true })
    note: string

    @ManyToOne(() => Staff, (staff) => staff.vehicles, { onDelete: 'SET NULL' })
    driver: Staff;

    @OneToMany(() => RouteStop, (routeStop) => routeStop.vehicle)
    stops: RouteStop[];

    @ManyToOne(() => Branch, (branch) => branch.vehicles, { onDelete: 'CASCADE' })
    branch: Branch;
}
