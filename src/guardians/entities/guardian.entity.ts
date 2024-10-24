import { BaseEntity } from "src/common/entities/base.entity";
import { Image } from "src/file-management/images/entities/image.entity";
import { Student } from "src/students/entities/student.entity";
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, OneToOne } from "typeorm";

@Entity()
export class Guardian extends BaseEntity {
    @Column({ type: 'varchar', length: 255 })
    firstName: string;

    @Column({ type: 'varchar', length: 255 })
    lastName: string;

    @Column({ type: 'varchar', length: 255 })
    phone: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    email?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    address?: string;

    @Column({ type: 'varchar', length: 255 })
    occupation: string;

    @OneToOne(() => Image, image => image.guardian_profileImage, { nullable: true })
    profileImage: Image

    @ManyToMany(() => Student, (student) => student.guardians)
    @JoinTable({ name: 'student_guardians' })
    students: Student[]
}
