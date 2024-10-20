import { Account } from "src/auth-system/accounts/entities/account.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity()
export class Recommendation extends BaseEntity {
    @Column({ type: 'datetime' })
    date: string;

    @Column({ type: "text" })
    title: string;

    @Column({ type: "longtext" })
    content: string;

    @ManyToOne(() => Account, (account) => account.recommendations, { onDelete: 'CASCADE' })
    account: Account;

}
