import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity } from "typeorm";

export enum EPasskeyChallengeType {
    Register = 'register',
    Login = 'login'
}

@Entity()
export class PasskeyChallenge extends BaseEntity {
    @Column({ type: 'text', nullable: false })
    challenge: string;

    @Column({ type: 'varchar' })
    email: string;

    @Column({ type: 'enum', enum: EPasskeyChallengeType })
    type: EPasskeyChallengeType;
}