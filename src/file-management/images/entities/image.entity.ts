import { Account } from "src/auth-system/accounts/entities/account.entity";
import { User } from "src/auth-system/users/entities/user.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { Guardian } from "src/guardians/entities/guardian.entity";
import { Staff } from "src/staffs/entities/staff.entity";
import { Student } from "src/students/entities/student.entity";
import { Teacher } from "src/teachers/entities/teacher.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from "typeorm";

@Entity()
export class Image extends BaseEntity {
    @Column({ type: 'varchar' })
    url!: string

    @Column({ type: 'varchar' })
    mimeType!: string

    @Column({ type: 'varchar' })
    format!: string

    @Column({ type: 'varchar' })
    space!: string

    @Column({ type: 'real' })
    height!: number

    @Column({ type: 'real' })
    width!: number

    @Column({ type: 'int' })
    size!: number

    @Column({ type: 'varchar' })
    originalName!: string

    @Column({ type: 'varchar', default: '' })
    name!: string

    @ManyToOne(() => Account, account => account.images, { onDelete: 'CASCADE' })
    uploadedBy!: Account

    /**
    |--------------------------------------------------
    | RELATIONS
    |--------------------------------------------------
    */

    @OneToOne(() => Account, account => account.profileImage, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn()
    account_profileImage: Account;

    // guardian
    @OneToOne(() => Guardian, guardian => guardian.profileImage, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn()
    guardian_profileImage: Guardian;
}
