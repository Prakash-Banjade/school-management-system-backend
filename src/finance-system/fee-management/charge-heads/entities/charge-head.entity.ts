import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity, OneToMany } from "typeorm";
import { FeeStructure } from "../../fee-structures/entities/fee-structure.entity";

export enum EChargeHeadPeriod {
    Monthly = 'monthly',
    One_Time = 'one_time',
    None = 'none'
}

@Entity()
export class ChargeHead extends BaseEntity {
    @Column({ type: 'varchar', unique: true })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'boolean', default: false })
    isMandatory: boolean;

    @Column({ type: 'enum', enum: EChargeHeadPeriod, default: EChargeHeadPeriod.Monthly })
    period: EChargeHeadPeriod;

    @OneToMany(() => FeeStructure, feeStructure => feeStructure.chargeHead)
    feeStructures: FeeStructure[];

    @OneToMany(() => FeeStructure, feeStructure => feeStructure.chargeHead)
    feeInvoiceItems: FeeStructure[];
}
