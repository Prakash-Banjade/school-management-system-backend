import { BaseEntity } from "src/common/entities/base.entity";
import { EGuardianRelation } from "src/common/types/global.type";
import { Image } from "src/file-management/images/entities/image.entity";
import { Student } from "src/students/entities/student.entity";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToOne } from "typeorm";

@Entity()
export class Guardian extends BaseEntity {
    @Column({ type: 'varchar', length: 255 })
    firstName: string;

    @Column({ type: 'varchar', length: 255 })
    lastName: string;

    @Column({ type: 'varchar', length: 255 })
    phone: string;

    @Column({ type: 'enum', enum: EGuardianRelation })
    relation: EGuardianRelation;

    @Column({ type: 'varchar', length: 255, nullable: true })
    email: string;

    @Column({ type: 'varchar', length: 255 })
    address: string;

    @Column({ type: 'varchar', length: 255 })
    occupation: string;

    @OneToOne(() => Image, image => image.guardian_profileImage, { cascade: true, nullable: true })
    profileImage: Image

    @ManyToOne(() => Student, (student) => student.guardians, { onDelete: 'CASCADE' })
    students: Student[]

    @Column({ type: 'boolean', default: false })
    receiveNotification: boolean;
}
