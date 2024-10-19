import { BadRequestException } from "@nestjs/common";
import { BaseEntity } from "src/core/entities/base.entity";
import { Dealer } from "src/dealers/entities/dealer.entity";
import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne } from "typeorm";

@Entity()
export class Purchase extends BaseEntity {
    @Column({ type: 'datetime' })
    date: string;

    @Column({ type: 'real' })
    rate: number;

    @Column({ type: 'int' })
    quantity: number;

    @Column({ type: 'varchar' })
    productName: string;

    @Column({ type: 'varchar' })
    productId: string;

    @Column({ type: 'real' })
    discountPercentage: number;

    @Column({ type: 'real', precision: 10, scale: 2 })
    totalAmount: number;

    @BeforeInsert()
    @BeforeUpdate()
    calculateTotalAmount() {
        if (this.discountPercentage > 100 || this.discountPercentage < 0) throw new BadRequestException('Invalid discount percentage');
        
        const total = this.rate * this.quantity;
        const discount = total * (this.discountPercentage / 100);
        this.totalAmount = total - discount;
    }

    @ManyToOne(() => Dealer, (dealer) => dealer.payments, { onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
    dealer: Dealer;
}
