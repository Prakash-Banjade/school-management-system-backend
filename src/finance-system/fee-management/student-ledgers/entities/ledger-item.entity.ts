import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from "typeorm";
import { FeeInvoice } from "../../fee-invoice/entities/fee-invoice.entity";
import { StudentLedger } from "./student-ledger.entity";
import { FeePayment } from "../../fee-payments/entities/fee-payment.entity";
import { BookTransaction } from "src/library-system/book-transactions/entities/book-transaction.entity";

export enum ELedgerItemType {
    Invoice = 'invoice',
    Payment = 'payment',
    LibraryFine = 'library_fine'
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

    @Column({ type: 'enum', enum: ELedgerItemType })
    type: ELedgerItemType;

    @Column({ type: 'text', nullable: true })
    remark: string;

    @OneToOne(() => FeePayment, feePayment => feePayment.ledgerItem, { onDelete: 'CASCADE' })
    @JoinColumn()
    feePayment: FeePayment;

    @OneToMany(() => BookTransaction, bookTransaction => bookTransaction.ledgerItem, { onDelete: 'CASCADE' })
    bookTransactions: BookTransaction[];

    @ManyToOne(() => StudentLedger, studentLedger => studentLedger.ledgerItems, { onDelete: 'CASCADE' })
    studentLedger: StudentLedger; // ? This is actually not necessary, because we can achieve ledger from feeInvoice.studentLedger, just for ease of use, this extra relatin is created
}