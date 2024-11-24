import { BaseEntity } from "src/common/entities/base.entity";
import { BeforeRemove, BeforeSoftRemove, BeforeUpdate, Column, Entity, ManyToOne, OneToMany, OneToOne } from "typeorm";
import { FeeInvoiceItem } from "./fee-invoice-item.entity";
import { StudentLedger } from "../../student-ledgers/entities/student-ledger.entity";
import { EMonth } from "src/common/types/months";
import { LedgerItem } from "../../student-ledgers/entities/ledger-item.entity";
import { MethodNotAllowedException } from "@nestjs/common";
import { FeePayment } from "../../fee-payments/entities/fee-payment.entity";

@Entity()
export class FeeInvoice extends BaseEntity {
    @BeforeUpdate()
    @BeforeRemove()
    @BeforeSoftRemove()
    preventMutation() {
        throw new MethodNotAllowedException('Mutatinos are not allowed on fee invoice.');
    }

    @Column({ type: 'varchar', unique: true })
    invoiceNo: string;

    @Column({ type: 'float' })
    totalAmount: number;

    @Column({ type: 'datetime' })
    invoiceDate: string;

    @Column({ type: 'datetime' })
    dueDate: string;

    @Column({ type: 'enum', enum: EMonth })
    month: EMonth;

    @OneToMany(() => FeeInvoiceItem, feeInvoiceItem => feeInvoiceItem.invoice, { cascade: true })
    items: FeeInvoiceItem[];

    @OneToMany(() => FeePayment, feePayment => feePayment.feeInvoice, { cascade: true })
    feePayments: FeePayment[];

    @OneToOne(() => LedgerItem, ledgerItem => ledgerItem.feeInvoice, { cascade: true })
    ledgerItem: LedgerItem;
}