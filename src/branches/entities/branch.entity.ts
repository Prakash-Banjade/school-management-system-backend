import { User } from "src/auth-system/users/entities/user.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity, OneToMany } from "typeorm";

@Entity()
export class Branch extends BaseEntity {
    @Column({ type: 'varchar', unique: true })
    name: string;

    @Column({ type: 'text' })
    address: string;

    @Column({ type: 'longtext', nullable: true })
    description: string | null;

    @OneToMany(() => User, user => user.branch)
    users: User[]
}
