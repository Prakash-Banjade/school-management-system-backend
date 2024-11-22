import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { FeeInvoice } from "./fee-invoice.entity";
import { ChargeHead } from "../../charge-heads/entities/charge-head.entity";

@Entity()
export class FeeInvoiceItem extends BaseEntity {
    @Column({ type: 'float' })
    amount: number;

    @Column({ type: 'float', default: 0 })
    discount: number;

    @ManyToOne(() => FeeInvoice, feeInvoice => feeInvoice.items, { onDelete: 'CASCADE', nullable: false })
    invoice: FeeInvoice;

    @ManyToOne(() => ChargeHead, chargeHead => chargeHead.feeInvoiceItems, { onDelete: 'CASCADE', nullable: false })
    chargeHead: ChargeHead;

    @Column({ type: 'text', nullable: true })
    remark: string;
}