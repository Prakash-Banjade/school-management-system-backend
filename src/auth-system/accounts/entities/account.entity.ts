import { BeforeInsert, BeforeUpdate, Column, Entity, Index, ManyToOne, OneToMany, OneToOne } from "typeorm";
import bcrypt from "bcryptjs";
import { BadRequestException } from "@nestjs/common";
import { BaseEntity } from "src/common/entities/base.entity";
import { Role } from "src/common/types/global.type";
import { User } from "src/auth-system/users/entities/user.entity";
import { Image } from "src/file-management/images/entities/image.entity";
import { BCRYPT_HASH, EMAIL_REGEX, PASSWORD_SALT_COUNT } from "src/common/CONSTANTS";
import { Student } from "src/students/entities/student.entity";
import { Teacher } from "src/teachers/entities/teacher.entity";
import { Staff } from "src/staffs/entities/staff.entity";
import { Attendance } from "src/attendances/entities/attendance.entity";
import { LeaveRequest } from "src/leave-requests/entities/leave-request.entity";
import { Task } from "src/task-system/tasks/entities/task.entity";
import { Branch } from "src/branches/entities/branch.entity";
import { WebAuthnCredential } from "src/auth-system/webAuthn/entities/webAuthnCredential.entity";
import { LoginDevice } from "./login-devices.entity";
import { getLowerCasedFullName } from "src/utils/utils";
import { Conversation } from "src/conversation-system/conversation/entities/conversation.entity";
import { Message } from "src/conversation-system/messages/entities/message.entity";

@Entity()
export class Account extends BaseEntity {
    @Column({ type: 'varchar' })
    firstName!: string;

    @Column({ type: 'varchar', default: '' })
    lastName?: string;

    @Index()
    @Column({ type: 'varchar' })
    lowerCasedFullName: string;

    setLowerCasedFullName() {
        this.lowerCasedFullName = getLowerCasedFullName(this.firstName, this.lastName);
    }

    @Index({ unique: true })
    @Column({ type: 'varchar' })
    email!: string;

    @Column({ type: 'varchar', nullable: true })
    password?: string;

    @Column({ type: 'enum', enum: Role, default: Role.USER })
    role: Role;

    @Column({ type: 'timestamp', nullable: true })
    verifiedAt: Date | null = null;

    @Column({ type: 'simple-array' })
    prevPasswords: string[];

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    passwordUpdatedAt: Date;

    @OneToMany(() => WebAuthnCredential, passkey => passkey.account)
    webAuthnCredentials: WebAuthnCredential[];

    @OneToMany(() => LoginDevice, loginDevice => loginDevice.account)
    loginDevices: LoginDevice[];

    @Column({ type: 'timestamp', nullable: true })
    twoFaEnabledAt: Date | null;

    @ManyToOne(() => Branch, branch => branch.accounts, { onDelete: 'RESTRICT', nullable: true })
    branch: Branch | null;

    @OneToOne(() => User, user => user.account, { nullable: true, cascade: true })
    user: User;

    @OneToOne(() => Student, student => student.account, { cascade: true, nullable: true })
    student: Student;

    @OneToOne(() => Teacher, teacher => teacher.account, { cascade: true, nullable: true })
    teacher: Teacher;

    @OneToOne(() => Staff, staff => staff.account, { cascade: true, nullable: true })
    staff: Staff;

    @OneToMany(() => Image, image => image.uploadedBy)
    images: Image[];

    @BeforeInsert()
    hashPassword() {
        if (this.password && !BCRYPT_HASH.test(this.password)) this.password = bcrypt.hashSync(this.password, PASSWORD_SALT_COUNT);
    }

    @BeforeInsert()
    @BeforeUpdate()
    validateEmail() {
        if (this.email && !EMAIL_REGEX.test(this.email)) throw new BadRequestException('Invalid email');
    }

    // Below relations are due to common use cases. Eg. Both student and teacher can have attendances, so instead of creating a separate relations i.e 
    // studentAttendances and teacherAttendances, i created a single attendances relation.
    @OneToMany(() => Attendance, attendance => attendance.account)
    attendances: Attendance[];

    @OneToMany(() => LeaveRequest, leaveRequest => leaveRequest.account)
    leaveRequests: LeaveRequest[];

    @OneToMany(() => Task, task => task.setBy)
    tasks: Task[];

    @OneToOne(() => Image, image => image.account_profileImage, { nullable: true })
    profileImage: Image | null;

    // only student and teacher can have conversationMessages
    @OneToMany(() => Message, message => message.sender)
    conversationMessages: Message[]
}
