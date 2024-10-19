import { BaseEntity } from "src/core/entities/base.entity";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { FeesGroup } from "../../fees-groups/entities/fees-group.entity";
import { FeeItem } from "../../fees-invoices/entities/fee-item.entity";

@Entity()
export class FeesType extends BaseEntity {
    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'longtext', nullable: true })
    description: string;

    @ManyToOne(() => FeesGroup, (feesGroup) => feesGroup.feesTypes, { onDelete: 'CASCADE' })
    feesGroup: FeesGroup

    @Column({ type: 'float', default: 0 })
    amount: number

    @OneToMany(() => FeeItem, (feeItem) => feeItem.feesType)
    feeItems: FeeItem[];
}
