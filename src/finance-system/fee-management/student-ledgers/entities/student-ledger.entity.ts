import { BaseEntity } from "src/common/entities/base.entity";
import { BeforeRemove, BeforeSoftRemove, Column, Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";
import { Enrollment } from "src/enrollments/entities/enrollment.entity";
import { LedgerItem } from "./ledger-item.entity";
import { MethodNotAllowedException } from "@nestjs/common";

@Entity()
export class StudentLedger extends BaseEntity {
    @BeforeRemove()
    @BeforeSoftRemove()
    preventDelete() {
        throw new MethodNotAllowedException('Deletions are not allowed on this entity.');
    }

    @OneToOne(() => Enrollment, enrollment => enrollment.ledger, { onDelete: "CASCADE" })
    @JoinColumn()
    enrollment: Enrollment;

    @Column({ type: 'float', default: 0 })
    amount: number;

    @OneToMany(() => LedgerItem, ledgerItem => ledgerItem.studentLedger)
    ledgerItems: LedgerItem[];

    updateAmount(updateAmount: number) {
        this.amount += updateAmount;
    }
}