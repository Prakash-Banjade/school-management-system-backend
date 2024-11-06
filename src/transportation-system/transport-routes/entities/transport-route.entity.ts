import { BaseEntity } from "src/common/entities/base.entity";
import { Student } from "src/students/entities/student.entity";
import { Column, Entity, OneToMany } from "typeorm";

@Entity()
export class TransportRoute extends BaseEntity {
    @Column({ type: 'varchar' })
    title: string;

    @Column({ type: 'real' })
    fare: number;

    @OneToMany(() => Student, (student) => student.transportRoute)
    students: Student[];
}
