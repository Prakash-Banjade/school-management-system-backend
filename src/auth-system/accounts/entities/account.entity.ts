import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";
import * as bcrypt from 'bcrypt';
import { BadRequestException } from "@nestjs/common";
import { BaseEntity } from "src/common/entities/base.entity";
import { AuthProvider, Role } from "src/common/types/global.type";
import { User } from "src/auth-system/users/entities/user.entity";
import { Image } from "src/file-management/images/entities/image.entity";
import { BCRYPT_HASH, EMAIL_REGEX, PASSWORD_SALT_COUNT } from "src/common/CONSTANTS";
import { Student } from "src/students/entities/student.entity";
import { Teacher } from "src/teachers/entities/teacher.entity";
import { Staff } from "src/staffs/entities/staff.entity";
import { Attendance } from "src/attendances/entities/attendance.entity";
import { LeaveRequest } from "src/leave-requests/entities/leave-request.entity";
import { Recommendation } from "src/recommendations/entities/recommendation.entity";
import { Task } from "src/task-system/tasks/entities/task.entity";
import { LessonPlan } from "src/subjects/lesson-plans/entities/lesson-plan.entity";

@Entity()
export class Account extends BaseEntity {
    @Column({ type: 'varchar' })
    firstName!: string;

    @Column({ type: 'varchar', default: '' })
    lastName?: string;

    @Column({ type: 'varchar' })
    email!: string;

    @Column({ type: 'varchar', nullable: true })
    password?: string;

    @Column({ type: 'enum', enum: Role, default: Role.USER })
    role: Role;

    @Column({ type: 'boolean', default: false })
    isVerified: boolean = false;

    @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.CREDENTIALS })
    provider: AuthProvider;

    @Column({ type: 'simple-array' })
    prevPasswords: string[];

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    passwordUpdatedAt: Date;

    @Column({ type: 'simple-array', nullable: true })
    refreshTokens: string[];

    @OneToOne(() => User, user => user.account, { nullable: true })
    user: User;

    @OneToOne(() => Student, student => student.account, { nullable: true })
    student: Student;

    @OneToOne(() => Teacher, teacher => teacher.account, { nullable: true })
    teacher: Teacher;

    @OneToOne(() => Staff, staff => staff.account, { nullable: true })
    staff: Staff;

    @OneToMany(() => Image, image => image.uploadedBy)
    images: Image[];

    @BeforeInsert()
    @BeforeUpdate()
    hashPassword() {
        if (!this.password) throw new BadRequestException('Password required');

        if (!BCRYPT_HASH.test(this.password)) this.password = bcrypt.hashSync(this.password, PASSWORD_SALT_COUNT);
    }

    @BeforeInsert()
    @BeforeUpdate()
    validateEmail() {
        if (!this.email) throw new BadRequestException('Email required');

        if (!EMAIL_REGEX.test(this.email)) throw new BadRequestException('Invalid email');
    }

    // Below relations are due to common use cases. Eg. Both student and teacher can have attendances, so instead of creating a separate relations i.e 
    // studentAttendances and teacherAttendances, i created a single attendances relation.
    @OneToMany(() => Attendance, attendance => attendance.account)
    attendances: Attendance[];

    @OneToMany(() => LeaveRequest, leaveRequest => leaveRequest.account)
    leaveRequests: LeaveRequest[];

    // @OneToMany(() => LibraryBookRequest, libraryBookRequest => libraryBookRequest.account)
    // libraryBookRequests: LibraryBookRequest[];

    @OneToMany(() => Recommendation, recommendation => recommendation.account)
    recommendations: Recommendation[];

    @OneToMany(() => Task, task => task.setBy)
    tasks: Task[];

    @OneToMany(() => LessonPlan, lessonPlan => lessonPlan.createdBy)
    createdLessonPlans: LessonPlan[];

}
