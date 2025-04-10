import { Account } from "src/auth-system/accounts/entities/account.entity";
import { ClassRoom } from "src/class-rooms/entities/class-room.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { EBloodGroup, EReligion, Gender } from "src/common/types/global.type";
import { DormitoryRoom } from "src/dormitory-system/dormitory-rooms/entities/dormitory-room.entity";
import { Enrollment } from "src/enrollments/entities/enrollment.entity";
import { ExamReport } from "src/examination-system/exam-reports/entities/exam-report.entity";
import { File } from "src/file-management/files/entities/file.entity";
import { Guardian } from "src/guardians/entities/guardian.entity";
import { BookTransaction } from "src/library-system/book-transactions/entities/book-transaction.entity";
import { OptionalSubject } from "src/optional-subject/entities/optional-subject.entity";
import { TaskSubmission } from "src/task-system/task-submissions/entities/task-submission.entity";
import { RouteStop } from "src/transportation-system/route-stops/entities/route-stop.entity";
import { Column, Entity, Index, JoinColumn, ManyToMany, ManyToOne, OneToMany, OneToOne } from "typeorm";

@Entity()
export class Student extends BaseEntity {
    /**
    |--------------------------------------------------
    | ACADEMIC INFO
    |--------------------------------------------------
    */

    @OneToMany(() => Enrollment, (enrollment) => enrollment.student, { cascade: true })
    enrollments: Enrollment[];

    @Column({ type: 'simple-array' })
    academicYearIds: string[];

    @ManyToOne(() => ClassRoom, (classRoom) => classRoom.students, { onDelete: 'RESTRICT' })
    classRoom: ClassRoom;

    @ManyToMany(() => OptionalSubject, (optionalSubject) => optionalSubject.students, { cascade: true })
    optionalSubjects: OptionalSubject[];

    @Column({ type: 'int' })
    rollNo: number;

    @ManyToOne(() => DormitoryRoom, (dormitoryRoom) => dormitoryRoom.students, { onDelete: 'RESTRICT' })
    dormitoryRoom: DormitoryRoom;

    @ManyToOne(() => RouteStop, (routeStop) => routeStop.students, { onDelete: 'SET NULL' })
    routeStop: RouteStop;

    @OneToMany(() => ExamReport, (examReport) => examReport.student)
    examReports: ExamReport[];

    @OneToMany(() => BookTransaction, (bookTransaction) => bookTransaction.student)
    bookTransactions: BookTransaction[]

    @OneToMany(() => TaskSubmission, (taskSubmission) => taskSubmission.student)
    taskSubmissions: TaskSubmission[];

    /**
    |--------------------------------------------------
    | PERSONAL INFORMATION
    |--------------------------------------------------
    */

    @Index({ unique: true })
    @Column({ type: 'varchar' })
    studentId: string;

    @OneToOne(() => Account, account => account.student, { onDelete: "RESTRICT" })
    @JoinColumn()
    account: Account;

    @Column({ type: 'varchar' })
    firstName: string;

    @Column({ type: 'varchar' })
    lastName: string;

    @Column({ type: 'enum', enum: Gender })
    gender: Gender

    @Column({ type: 'datetime' })
    dob: string;

    @Column({ type: 'enum', enum: EReligion })
    religion: EReligion;

    @Column({ type: 'varchar', default: '' })
    caste?: string;

    @Column({ type: 'boolean', default: false })
    isPhysicallyChallenged: boolean;

    /**
    |--------------------------------------------------
    | CONTACT INFORMATION
    |--------------------------------------------------
    */

    @Column({ type: 'varchar', unique: true })
    email: string;

    @Column({ type: 'varchar' })
    phone: string;

    /**
    |--------------------------------------------------
    | MEDICAL RECORD
    |--------------------------------------------------
    */

    @Column({ type: 'enum', enum: EBloodGroup })
    bloodGroup: EBloodGroup

    /**
    |--------------------------------------------------
    | GUARDIANS
    |--------------------------------------------------
    */

    @ManyToMany(() => Guardian, (guardian) => guardian.students, { cascade: true })
    guardians: Guardian[]

    /**
    |--------------------------------------------------
    | STUDENT ADDRESS
    |--------------------------------------------------
    */

    @Column({ type: 'varchar' })
    currentAddress: string;

    @Column({ type: 'varchar' })
    permanentAddress: string;

    /**
    |--------------------------------------------------
    | DOCUMENT INFORMATION
    |--------------------------------------------------
    */

    @Column({ type: 'varchar', nullable: true, unique: true })
    nationalIdCardNo: string;

    @Column({ type: 'varchar', nullable: true, unique: true })
    birthCertificateNumber: string;

    @OneToMany(() => File, (documentAttachments) => documentAttachments.student_documentAttachment)
    documentAttachments: File[];

    /**
    |--------------------------------------------------
    | BANK INFORMATION
    |--------------------------------------------------
    */

    @Column({ type: 'varchar', default: '' })
    bankName: string;

    @Column({ type: 'varchar', default: '' })
    bankAccountName: string

    @Column({ type: 'varchar', default: '' })
    bankAccountNumber: string;


    /**
    |--------------------------------------------------
    | PREVIOUS SCHOOL INFORMATION
    |--------------------------------------------------
    */

    @Column({ type: 'varchar', default: '' })
    previousSchoolName: string;

    @Column({ type: 'longtext', nullable: true })
    previousSchoolDetails: string;

    // TODO: assign transport route
}
