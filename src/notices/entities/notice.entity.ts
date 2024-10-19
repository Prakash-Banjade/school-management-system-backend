import { BaseEntity } from "src/core/entities/base.entity";
import { Column, Entity } from "typeorm";

@Entity()
export class Notice extends BaseEntity {
    @Column({ type: 'datetime' })
    date: string;

    @Column({ type: "text" })
    title: string;

    @Column({ type: "longtext" })
    description: string;
}
