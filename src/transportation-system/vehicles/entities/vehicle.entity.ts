import { BaseEntity } from "src/common/entities/base.entity";
import { Staff } from "src/staffs/entities/staff.entity";
import { TransportRoute } from "src/transportation-system/transport-routes/entities/transport-route.entity";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity()
export class Vehicle extends BaseEntity {
    @Column({ type: 'varchar' })
    vehicleNumber: string;

    @Column({ type: 'varchar' })
    vehicleModel: string;

    @Column({ type: 'int' })
    yearMade: number;

    @Column({ type: 'longtext', nullable: true })
    note: string

    @ManyToOne(() => Staff, (staff) => staff.vehicles, { onDelete: 'SET NULL' })
    driver: Staff

    @ManyToOne(() => TransportRoute, (transportRoute) => transportRoute.vehicles, { onDelete: 'SET NULL', nullable: true })
    transportRoute: TransportRoute;
}
