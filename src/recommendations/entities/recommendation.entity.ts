import { BaseEntity } from "src/core/entities/base.entity";
import { User } from "src/users/entities/user.entity";
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
