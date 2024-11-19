import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity } from "typeorm";

@Entity()
export class ChargeHead extends BaseEntity {
    @Column({ type: 'text' })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'boolean', default: false })
    isMandatory: boolean;
}
