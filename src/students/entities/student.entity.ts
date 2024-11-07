import { Account } from "src/auth-system/accounts/entities/account.entity";
import { ClassRoom } from "src/class-rooms/entities/class-room.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { EBloodGroup, EReligion, Gender } from "src/common/types/global.type";
import { DormitoryRoom } from "src/dormitory-system/dormitory-rooms/entities/dormitory-room.entity";
import { Enrollment } from "src/enrollments/entities/enrollment.entity";
import { ExamReport } from "src/examination-system/exam-reports/entities/exam-report.entity";
import { File } from "src/file-management/files/entities/file.entity";
import { Image } from "src/file-management/images/entities/image.entity";
import { FeesInvoice } from "src/finance-system/fees-system/fees-invoices/entities/fees-invoice.entity";
import { Guardian } from "src/guardians/entities/guardian.entity";
import { BookTransaction } from "src/library-system/book-transactions/entities/book-transaction.entity";
import { TaskSubmission } from "src/task-system/task-submissions/entities/task-submission.entity";
import { RouteStop } from "src/transportation-system/route-stops/entities/route-stop.entity";
import { generateTeacherId } from "src/utils/generate-teacher-id";
import { BeforeInsert, Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, OneToOne } from "typeorm";

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

    @Column({ type: 'int' })
    rollNo: number;

    @OneToMany(() => FeesInvoice, (feesInvoice) => feesInvoice.student)
    feesInvoices: FeesInvoice[];

    @ManyToOne(() => DormitoryRoom, (dormitoryRoom) => dormitoryRoom.students, { onDelete: 'RESTRICT' })
    dormitoryRoom: DormitoryRoom;

    @ManyToOne(() => RouteStop, (routeStop) => routeStop.students, { onDelete: 'SET NULL' })
    routeStop: RouteStop;

    @OneToMany(() => ExamReport, (examReport) => examReport.student)
    examReports: ExamReport[];

    @OneToMany(() => BookTransaction, (bookTransaction) => bookTransaction.student)
    bookTransactions: BookTransaction[]

    @OneToMany(() => TaskSubmission, (taskSubmission) => taskSubmission.student)
    taskSubmissions: TaskSubmission[]

    /**
    |--------------------------------------------------
    | PERSONAL INFORMATION
    |--------------------------------------------------
    */

    @Column({ type: 'int' })
    studentId: number;

    @BeforeInsert()
    generateStudentId() {
        this.studentId = generateTeacherId();
    }

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

    @OneToOne(() => Image, image => image.student_profileImage, { nullable: true })
    profileImage: Image;

    @Column({ type: 'boolean', default: false })
    isPhysicallyChallenged: boolean;

    /**
    |--------------------------------------------------
    | CONTACT INFORMATION
    |--------------------------------------------------
    */

    @Column({ type: 'varchar' })
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

    @Column({ type: 'varchar', default: '' })
    nationalIdCardNo: string;

    @Column({ type: 'varchar', default: '' })
    birthCertificateNumber: string;

    @Column({ type: 'longtext', nullable: true })
    additionalNotes: string;

    @OneToMany(() => File, (documentAttachments) => documentAttachments.student_documentAttachments)
    documentAttachments: File[];

    /**
    |--------------------------------------------------
    | BANK INFORMATION
    |--------------------------------------------------
    */

    @Column({ type: 'varchar', default: '' })
    bankName: string;

    @Column({ type: 'varchar', default: '' })
    bankAccountNumber: string;

    @Column({ type: 'varchar', default: '' })
    ifscCode: string;


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
