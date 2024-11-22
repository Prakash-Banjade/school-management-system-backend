import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { FeeInvoiceItem } from "./fee-invoice-item.entity";
import { StudentLedger } from "../../student-ledgers/entities/student-ledger.entity";
import { EMonth } from "src/common/types/months";

@Entity()
export class FeeInvoice extends BaseEntity {
    @Column({ type: 'varchar', unique: true })
    invoiceNo: string;
    
    @ManyToOne(() => StudentLedger, studentLedger => studentLedger.feeInvoices, { onDelete: 'CASCADE' })
    studentLedger: StudentLedger;

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
}