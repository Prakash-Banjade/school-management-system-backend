import { BaseEntity } from "src/common/entities/base.entity";
import { Payment } from "src/finance-system/payments/entities/payment.entity";
import { Column, Entity, OneToMany } from "typeorm";

@Entity()
export class Dealer extends BaseEntity {
    @Column({ type: 'varchar' })
    name: string;

    @Column({ type: 'varchar' })
    contact: string;

    @Column({ type: 'int' })
    panNo: number;

    @Column({ type: 'varchar' })
    address: string;

    @Column({ type: 'varchar' })
    accountName: string;

    @Column({ type: 'varchar' })
    accountNumber: string;

    @Column({ type: 'varchar' })
    bankName: string;

    @OneToMany(() => Payment, payment => payment.dealer)
    payments: Payment[]
}
