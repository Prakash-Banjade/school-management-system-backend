import { Account } from "src/auth-system/accounts/entities/account.entity";
import { User } from "src/auth-system/users/entities/user.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { Student } from "src/students/entities/student.entity";
import { Task } from "src/tasks/entities/task.entity";
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

    // relations
    @OneToOne(() => User, user => user.profileImage, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn()
    user_profileImage: User;

    // student
    @OneToOne(() => Student, student => student.profileImage, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn()
    student_profileImage: Student;

    @ManyToOne(() => Student, (student) => student.documentAttatchments, { onDelete: 'CASCADE', nullable: true })
    student_documentAttatchments: Student;

    // teacher
    @OneToOne(() => Teacher, teacher => teacher.profileImage, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn()
    teacher_profileImage: Teacher;

    // task
    @OneToOne(() => Task, task => task.attatchments, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn()
    task_attatchments: Task;
}
