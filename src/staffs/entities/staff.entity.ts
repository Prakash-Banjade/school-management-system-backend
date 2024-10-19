import { Account } from "src/accounts/entities/account.entity";
import { BaseEntity } from "src/core/entities/base.entity";
import { BloodGroup, EStaff, Gender, MaritalStatus } from "src/core/types/global.types";
import { generateTeacherId } from "src/core/utils/generate-teacher-id";
import { Image } from "src/images/entities/image.entity";
import { Vehicle } from "src/transportation-system/vehicles/entities/vehicle.entity";
import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";

@Entity()
export class Staff extends BaseEntity {
    @Column({ type: 'int' })
    staffId: number;

    @BeforeInsert()
    @BeforeUpdate()
    generateTeacherId() {
        if (!this.staffId) this.staffId = generateTeacherId();
    }

    @Column({ type: 'varchar' })
    firstName: string;

    @Column({ type: 'varchar', default: '' })
    lastName?: string;

    @Column({ type: 'enum', enum: Gender })
    gender: Gender

    @Column({ type: 'varchar' })
    email: string

    @Column({ type: 'varchar' })
    phone: string

    @Column({ type: 'datetime' })
    dob: string;

    @OneToOne(() => Account, { onDelete: "SET NULL" })
    @JoinColumn()
    account: Account;

    @Column({ type: 'real' })
    wage: number

    @OneToOne(() => Image, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    profileImage?: Image

    @Column({ type: 'enum', enum: EStaff })
    type: EStaff;

    @Column({ type: 'longtext', nullable: true })
    shortDescription?: string;

    @Column({ type: 'enum', enum: MaritalStatus })
    maritalStatus: MaritalStatus

    @Column({ type: 'varchar' })
    qualification: string;

    @Column({ type: 'enum', enum: BloodGroup })
    bloodGroup: BloodGroup

    @Column({ type: 'datetime' })
    joinedDate: string

    @Column({ type: 'varchar', nullable: true })
    bankName: string;

    @Column({ type: 'varchar', nullable: true })
    accountName: string

    @Column({ type: 'varchar', nullable: true })
    accountNumber: string

    /**
    |--------------------------------------------------
    | FOR DRIVER STAFF
    |--------------------------------------------------
    */
    @OneToMany(() => Vehicle, vehicle => vehicle.driver)
    vehicles: Vehicle[]
}
