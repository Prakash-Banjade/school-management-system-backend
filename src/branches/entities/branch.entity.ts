import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity } from "typeorm";

@Entity()
export class Branch extends BaseEntity {
    @Column({ type: 'varchar', unique: true })
    name: string;

    @Column({ type: 'text' })
    address: string;

    @Column({ type: 'longtext', nullable: true })
    description: string | null;
}
