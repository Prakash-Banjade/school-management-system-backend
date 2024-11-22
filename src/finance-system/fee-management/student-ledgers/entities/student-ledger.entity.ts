import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";
import { FeeInvoice } from "../../fee-invoice/entities/fee-invoice.entity";
import { Enrollment } from "src/enrollments/entities/enrollment.entity";

@Entity()
export class StudentLedger extends BaseEntity {
    @OneToOne(() => Enrollment, enrollment => enrollment.ledger, { onDelete: "CASCADE" })
    @JoinColumn()
    enrollment: Enrollment;

    @Column({ type: 'float', default: 0 })
    amount: number;

    @OneToMany(() => FeeInvoice, feeInvoice => feeInvoice.studentLedger)
    feeInvoices: FeeInvoice[];
}