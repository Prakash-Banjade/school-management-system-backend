import { AttestationFormat, CredentialDeviceType, WebAuthnCredential } from "@simplewebauthn/server";
import { Account } from "src/auth-system/accounts/entities/account.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity()
export class Passkey extends BaseEntity {
    @ManyToOne(() => Account, account => account.passkeys, { onDelete: 'CASCADE' })
    account: Account

    @Column({ type: 'varchar' })
    fmt: AttestationFormat;

    @Column({ type: 'varchar' })
    aaguid: string;

    @Column({ type: 'json', nullable: false })
    credential: WebAuthnCredential;

    @Column({ type: 'longtext', nullable: false })
    attestationObject: Uint8Array;

    @Column({ type: 'varchar' })
    credentialDeviceType: CredentialDeviceType;

    @Column({ type: 'varchar' })
    origin: string;

    @Column({ type: 'text', nullable: false })
    rpID?: string;
}