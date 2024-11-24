import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity, ManyToOne, OneToOne } from "typeorm";
import { FeeInvoice } from "../../fee-invoice/entities/fee-invoice.entity";
import { EPaymentMethod } from "src/common/types/global.type";
import { LedgerItem } from "../../student-ledgers/entities/ledger-item.entity";

@Entity()
export class FeePayment extends BaseEntity {
    @Column({ type: 'varchar', unique: true })
    receiptNo: string;

    @Column({ type: 'float' })
    amount: number;

    @ManyToOne(() => FeeInvoice, (feeInvoice) => feeInvoice.feePayments, { onDelete: 'CASCADE' })
    feeInvoice: FeeInvoice;

    @Column({ type: 'text', nullable: true })
    remark: string;

    @Column({ type: 'enum', enum: EPaymentMethod })
    paymentMethod: EPaymentMethod;

    @OneToOne(() => LedgerItem, ledgerItem => ledgerItem.feePayment, { cascade: true })
    ledgerItem: LedgerItem;
}