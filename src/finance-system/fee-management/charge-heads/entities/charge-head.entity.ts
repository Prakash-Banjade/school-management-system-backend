import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity, OneToMany } from "typeorm";
import { FeeStructure } from "../../fee-structures/entities/fee-structure.entity";

@Entity()
export class ChargeHead extends BaseEntity {
    @Column({ type: 'varchar', unique: true })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'boolean', default: false })
    isMandatory: boolean;

    @OneToMany(() => FeeStructure, feeStructure => feeStructure.chargeHead)
    feeStructures: FeeStructure[];
}
