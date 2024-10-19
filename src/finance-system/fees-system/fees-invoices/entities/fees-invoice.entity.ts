import { BadRequestException } from "@nestjs/common";
import { BaseEntity } from "src/core/entities/base.entity";
import { EFeeInvoicePaymentStatus, EPaymentMethod } from "src/core/types/global.types";
import { Student } from "src/students/entities/student.entity";
import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { FeeItem } from "./fee-item.entity";

@Entity()
export class FeesInvoice extends BaseEntity {
    @ManyToOne(() => Student, (student) => student.feesInvoices)
    student: Student;

    @Column({ type: 'datetime' })
    createDate: string;

    @Column({ type: 'datetime' })
    dueDate: string;

    @Column({ type: 'enum', enum: EFeeInvoicePaymentStatus })
    paymentStatus: EFeeInvoicePaymentStatus;

    @Column({ type: 'enum', enum: EPaymentMethod, nullable: true })
    paymentMethod: EPaymentMethod;

    @BeforeInsert()
    @BeforeUpdate()
    async validate() {
        if (new Date(this.dueDate).getTime() < new Date(this.createDate).getTime()) {
            throw new BadRequestException('Due date cannot be less than create date');
        }

        if (this.paymentStatus !== EFeeInvoicePaymentStatus.NOT_PAID && !this.paymentMethod) {
            throw new BadRequestException('Payment method is required when payment status is paid');
        }

        if (this.paymentStatus === EFeeInvoicePaymentStatus.NOT_PAID) {
            this.paymentMethod = null;
        }
    }

    @OneToMany(() => FeeItem, (feeItem) => feeItem.feesInvoice)
    feeItems: FeeItem[];
}
