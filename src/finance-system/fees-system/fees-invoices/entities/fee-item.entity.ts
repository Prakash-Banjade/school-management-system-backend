import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne } from "typeorm";
import { FeesType } from "../../fees-types/entities/fees-type.entity";
import { BadRequestException } from "@nestjs/common";
import { FeesInvoice } from "./fees-invoice.entity";
import { BaseEntity } from "src/common/entities/base.entity";

@Entity()
export class FeeItem extends BaseEntity {
    @ManyToOne(() => FeesType, feesType => feesType.feeItems)
    feesType: FeesType

    @Column({ type: "real" })
    amount: number

    @Column({ type: "real", default: 0 })
    waiver: number

    @Column({ type: "real" })
    subTotal: number

    @Column({ type: "real" })
    paidAmount: number

    @Column({ type: "real" })
    remainingAmount: number

    @BeforeInsert()
    @BeforeUpdate()
    validateAndPerformCalculations() {
        if (this.waiver > this.amount) throw new BadRequestException('Waiver cannot be greater than amount');

        const subTotal = this.amount - this.waiver;
        this.subTotal = subTotal;

        if (this.paidAmount > subTotal) throw new BadRequestException('Paid amount cannot be greater than sub total');

        this.remainingAmount = this.subTotal - this.paidAmount;
    }

    @ManyToOne(() => FeesInvoice, feesInvoice => feesInvoice.feeItems, { onDelete: 'CASCADE' })
    feesInvoice: FeesInvoice
}