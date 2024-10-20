import { BaseEntity } from "src/common/entities/base.entity";
import { EPaymentMethod } from "src/common/types/global.type";
import { Dealer } from "src/dealers/entities/dealer.entity";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity()
export class Payment extends BaseEntity {
    @Column({ type: 'datetime' })
    date: string;

    @Column({ type: 'real' })
    paidAmount: number;

    @Column({ type: 'longtext' })
    shortDescription: string;

    @Column({ type: 'enum', enum: EPaymentMethod })
    paymentMethod: EPaymentMethod;

    @Column({ type: 'longtext' })
    paymentReference: string;

    @Column({ type: 'boolean' })
    isTds: boolean;

    @ManyToOne(() => Dealer, (dealer) => dealer.payments, { onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
    dealer: Dealer;
}
