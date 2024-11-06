import { BaseEntity } from "src/common/entities/base.entity";
import { Student } from "src/students/entities/student.entity";
import { RouteStop } from "src/transportation-system/route-stops/entities/route-stop.entity";
import { Column, Entity, OneToMany } from "typeorm";

@Entity()
export class TransportRoute extends BaseEntity {
    @Column({ type: 'varchar' })
    name: string;

    @Column({ type: 'real' })
    distance: number;
}
