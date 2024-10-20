import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity } from "typeorm";

@Entity()
export class MarksGrade extends BaseEntity {
    @Column({ type: "varchar" })
    gradeName: string;

    @Column({ type: "float" })
    gpa: number;

    @Column({ type: "float" })
    percentFrom: number;

    @Column({ type: "float" })
    percentTo: number;

    @Column({ type: "float" })
    gpaFrom: number;

    @Column({ type: "float" })
    gpaTo: number;

    @Column({ type: "longtext", nullable: true })
    description: string;
}
