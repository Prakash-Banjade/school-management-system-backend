import { BaseEntity } from "src/common/entities/base.entity";
import { BeforeInsert, BeforeRemove, BeforeSoftRemove, BeforeUpdate, Column, Entity, OneToMany } from "typeorm";
import { FeeStructure } from "../../fee-structures/entities/fee-structure.entity";
import { BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { CHARGE_HEADS } from "src/common/CONSTANTS";

export enum EChargeHeadPeriod {
    Monthly = 'monthly',
    One_Time = 'one_time',
    None = 'none'
}

export enum EChargeHeadType {
    Regular = 'regular',
    Ad_Hoc = 'ad_hoc',
}

@Entity()
export class ChargeHead extends BaseEntity {
    @BeforeRemove()
    @BeforeSoftRemove()
    @BeforeUpdate()
    preventMutationForDefaultHeads() {
        if (!this.name) throw new InternalServerErrorException('Cannot find head name.')
        if (Object.values(CHARGE_HEADS).includes(this.name)) throw new BadRequestException('Cannot udpate or delete default charge heads.')
    }

    /**
     * Charge head with type "ad_hoc" can only have "none" period
     * Charge head with type "regular" cannot have "none" period
     */
    @BeforeInsert()
    @BeforeUpdate()
    validateTypeAndPeriod() {
        const providedType = this.type ?? EChargeHeadType.Regular;
        const providedPeriod = this.period ?? EChargeHeadPeriod.Monthly;

        if (providedType === EChargeHeadType.Ad_Hoc) {
            this.period = EChargeHeadPeriod.None;
            this.isMandatory = false;
        }
        if (providedType === EChargeHeadType.Regular && providedPeriod === EChargeHeadPeriod.None) {
            this.period = EChargeHeadPeriod.Monthly;
        }
    }

    @Column({ type: 'varchar', unique: true })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'boolean', default: false })
    isMandatory: boolean;

    @Column({ type: 'enum', enum: EChargeHeadPeriod, default: EChargeHeadPeriod.Monthly })
    period: EChargeHeadPeriod;

    @Column({ type: 'integer', default: 10 }) // just random number greater than 4 (length of mandatory charge heads)
    order: number;

    @OneToMany(() => FeeStructure, feeStructure => feeStructure.chargeHead)
    feeStructures: FeeStructure[];

    @OneToMany(() => FeeStructure, feeStructure => feeStructure.chargeHead)
    feeInvoiceItems: FeeStructure[];

    @Column({ type: 'enum', enum: EChargeHeadType, default: EChargeHeadType.Regular })
    type: EChargeHeadType;
}
