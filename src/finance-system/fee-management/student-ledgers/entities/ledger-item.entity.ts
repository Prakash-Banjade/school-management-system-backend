import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from "typeorm";
import { FeeInvoice } from "../../fee-invoice/entities/fee-invoice.entity";
import { StudentLedger } from "./student-ledger.entity";
import { FeePayment } from "../../fee-payments/entities/fee-payment.entity";

export enum ELedgerItemType {
    Invoice = 'invoice',
    Payment = 'payment',
}

@Entity()
export class LedgerItem extends BaseEntity {
    @Column({ type: 'datetime' })
    date: string;

    @Column({ type: 'float' })
    ledgerAmount: number;

    @OneToOne(() => FeeInvoice, feeInvoice => feeInvoice.ledgerItem, { onDelete: 'CASCADE' })
    @JoinColumn()
    feeInvoice: FeeInvoice;

    @OneToOne(() => FeePayment, feePayment => feePayment.ledgerItem, { onDelete: 'CASCADE' })
    @JoinColumn()
    feePayment: FeePayment;

    @ManyToOne(() => StudentLedger, studentLedger => studentLedger.ledgerItems, { onDelete: 'CASCADE' })
    studentLedger: StudentLedger; // ? This is actually not necessary, because we can achieve ledger from feeInvoice.studentLedger, just for ease of use, this extra relatin is created
}