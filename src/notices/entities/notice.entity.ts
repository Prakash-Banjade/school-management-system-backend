import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity } from "typeorm";

@Entity()
export class Notice extends BaseEntity {
    @Column({ type: "text" })
    title: string;

    @Column({ type: "longtext" })
    description: string;
}
