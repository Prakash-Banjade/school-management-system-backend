import { User } from "src/auth-system/users/entities/user.entity";
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

    @ManyToOne(() => User, (user) => user.recommendations, { onDelete: 'CASCADE' })
    user: User;

}
