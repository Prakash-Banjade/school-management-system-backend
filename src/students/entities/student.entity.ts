import { Account } from "src/auth-system/accounts/entities/account.entity";
import { ClassRoom } from "src/class-rooms/entities/class-room.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { EBloodGroup, EReligion, Gender } from "src/common/types/global.type";
import { DormitoryRoom } from "src/dormitory-system/dormitory-rooms/entities/dormitory-room.entity";
import { Enrollment } from "src/enrollments/entities/enrollment.entity";
import { ExamReport } from "src/examination-system/exam-reports/entities/exam-report.entity";
import { Image } from "src/file-management/images/entities/image.entity";
import { FeesInvoice } from "src/finance-system/fees-system/fees-invoices/entities/fees-invoice.entity";
import { Guardian } from "src/guardians/entities/guardian.entity";
import { TransportRoute } from "src/transportation-system/transport-routes/entities/transport-route.entity";
import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, OneToOne } from "typeorm";

@Entity()
export class Student extends BaseEntity {
    /**
    |--------------------------------------------------
    | ACADEMIC INFO
    |--------------------------------------------------
    */

    @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
    enrollments: Enrollment[]

    @ManyToOne(() => ClassRoom, (classRoom) => classRoom.students, { onDelete: 'RESTRICT' })
    classRoom: ClassRoom;

    @Column({ type: 'int' })
    rollNo: number;

    @Column({ type: 'datetime' })
    admissionDate: string;

    @Column({ type: 'int', default: 0 })
    feeDiscountPercentage: number;

    @Column({ type: 'int', default: 0 })
    admissionDiscountPercentage: number;

    @OneToMany(() => FeesInvoice, (feesInvoice) => feesInvoice.student)
    feesInvoices: FeesInvoice[];

    @ManyToOne(() => DormitoryRoom, (dormitoryRoom) => dormitoryRoom.students, { onDelete: 'RESTRICT' })
    dormitoryRoom: DormitoryRoom;

    @ManyToOne(() => TransportRoute, (transportRoute) => transportRoute.students, { onDelete: 'RESTRICT' })
    transportRoute: TransportRoute

    @OneToMany(() => ExamReport, (examReport) => examReport.student)
    examReports: ExamReport[];

    /**
    |--------------------------------------------------
    | PERSONAL INFORMATION
    |--------------------------------------------------
    */

    @OneToOne(() => Account, account => account.student, { onDelete: "SET NULL" })
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

    @Column({ type: 'enum', enum: EReligion, nullable: true })
    religion: EReligion;

    @Column({ type: 'varchar', nullable: true })
    caste?: string;

    @OneToOne(() => Image, image => image.student_profileImage, { nullable: true })
    profileImage: Image;

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

    @ManyToMany(() => Guardian, (guardian) => guardian.students)
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

    @Column({ type: 'varchar', nullable: true })
    nationalIdCardNo: string;

    @Column({ type: 'varchar', nullable: true })
    birthCertificateNumber: string;

    @Column({ type: 'longtext', nullable: true })
    additionalNotes: string;

    @OneToMany(() => Image, (documentAttatchments) => documentAttatchments.student_documentAttatchments)
    documentAttatchments: Image[];

    /**
    |--------------------------------------------------
    | BANK INFORMATION
    |--------------------------------------------------
    */

    @Column({ type: 'varchar', nullable: true })
    bankName: string;

    @Column({ type: 'varchar', nullable: true })
    bankAccountNumber: string;

    @Column({ type: 'varchar', nullable: true })
    ifscCode: string;


    /**
    |--------------------------------------------------
    | PREVIOUS SCHOOL INFORMATION
    |--------------------------------------------------
    */

    @Column({ type: 'longtext', nullable: true })
    previousSchoolDetails: string;

    // TODO: assign transport route and dormitory
}
