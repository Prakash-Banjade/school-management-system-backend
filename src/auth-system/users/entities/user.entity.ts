import { Entity, JoinColumn, OneToOne } from "typeorm";
import { BaseEntity } from "src/common/entities/base.entity";
import { Account } from "src/auth-system/accounts/entities/account.entity";

@Entity()
export class User extends BaseEntity {
    @OneToOne(() => Account, account => account.user, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn()
    account: Account;
}
