import { ConflictException, Inject, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Brackets, DataSource, Not } from "typeorm";
import { Student } from "../entities/student.entity";
import { PastStudentsQueryDto, StudentAttendanceQueryDto, StudentQueryDto } from "../dto/student-query.dto";
import { CreateStudentDto } from "../dto/create-student.dto";
import { UpdateStudentDto } from "../dto/update-student.dto";
import { Attendance } from "src/attendances/entities/attendance.entity";
import { CHARGE_HEADS } from "src/common/CONSTANTS";
import { paginatedRawData } from "src/utils/paginatedData";
import { BaseRepository } from "src/common/repository/base-repository";
import { REQUEST } from "@nestjs/core";
import { FastifyRequest } from "fastify";
import { FeeStructure } from "src/finance-system/fee-management/fee-structures/entities/fee-structure.entity";
import { ChargeHead, EChargeHeadType } from "src/finance-system/fee-management/charge-heads/entities/charge-head.entity";
import { FeeInvoice } from "src/finance-system/fee-management/fee-invoice/entities/fee-invoice.entity";
import { ELedgerItemType } from "src/finance-system/fee-management/student-ledgers/entities/ledger-item.entity";
import { isUUID } from "class-validator";
import { UtilitiesService } from "src/utilities/utilities.service";

@Injectable()
export class StudentsHelper extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
        private readonly utilitiesService: UtilitiesService,
    ) { super(dataSource, req); }

    async findAll(queryDto: StudentQueryDto) {
        const academicYearId = queryDto.academicYearId || await this.utilitiesService.getAcademicYearId();
        console.log(academicYearId)

        const queryBuilder = this.getRepository(Student).createQueryBuilder('student');

        if (!queryDto.skipPagination) {
            queryBuilder.offset(queryDto.skip).limit(queryDto.take);
        }

        queryBuilder
            .orderBy(queryDto.sortBy, queryDto.order)
            .innerJoin('student.enrollments', 'enrollments', "enrollments.academicYearId = :academicYearId", { academicYearId: academicYearId })
            .leftJoin('enrollments.classRoom', 'classRoom')
            .leftJoin('classRoom.parent', 'parent')
            .leftJoin('classRoom.faculty', 'faculty')
            .leftJoin('student.account', 'account')
            .leftJoin('enrollments.ledger', 'ledger');

        if (!queryDto.onlyBasicInfo) {
            queryBuilder
                .leftJoin('account.profileImage', 'profileImage')
                .leftJoin('student.routeStop', 'routeStop')
        }

        queryBuilder
            .where(new Brackets(qb => {
                if (queryDto.search) {
                    qb.orWhere("account.lowerCasedFullName LIKE LOWER(:search)", { search: `${queryDto.search}%` })
                        .orWhere("student.studentId = :exactSearch", { exactSearch: queryDto.search })
                }
            }))
            .andWhere(new Brackets(qb => {
                queryDto.studentId && qb.andWhere('student.studentId = :studentId', { studentId: queryDto.studentId });

                queryDto.facultyId && qb.andWhere('faculty.id = :facultyId', { facultyId: queryDto.facultyId });
                queryDto.sectionId && qb.andWhere('classRoom.id = :sectionId', { sectionId: queryDto.sectionId }); // the sectionId send by the frontend is the class room id
                // if class room id, check in both section and class room
                queryDto.classRoomId && qb.andWhere('parent.id = :classRoomId OR classRoom.id = :classRoomId', { classRoomId: queryDto.classRoomId });
            }))
            .cache(true)
            .select(
                queryDto.includeLedgerAmount ? [
                    ...this.getStudentsSelectCols(queryDto.onlyBasicInfo),
                    "ledger.amount as ledgerAmount"
                ] : this.getStudentsSelectCols(queryDto.onlyBasicInfo)
            );

        this.utilitiesService.applyBranchFilter(queryBuilder);

        return paginatedRawData(queryDto, queryBuilder);
    }

    private getStudentsSelectCols(onlyBasicInfo: boolean) {
        const basicCols = [
            "student.id as id",
            "CONCAT(student.firstName, ' ', student.lastName) AS fullName",
            "enrollments.rollNo as rollNo",
            "student.studentId as studentId",
            "classRoom.id as classRoomId",
            "CASE WHEN parent.id IS NULL THEN classRoom.name ELSE CONCAT(parent.name, ' - ', classRoom.name) END AS classRoomName",
            "faculty.name as faculty",
        ];

        return onlyBasicInfo
            ? basicCols
            : [
                ...basicCols,
                "student.phone as phone",
                "student.email as email",
                "student.dob as dob",
                "student.studentId as studentId",
                "student.gender as gender",
                "profileImage.url as profileImageUrl",
                "classRoom.id as classRoomId",
                "classRoom.name as classRoom",
                "parent.id as parentClassId",
                "parent.name as parentClass",
                "routeStop.id as routeStopId",
                "routeStop.name as routeStop",
                "account.id as accountId",
                "faculty.name as faculty",
            ]
    }

    async checkIfStudentExists(studentDto: CreateStudentDto | UpdateStudentDto, student?: Student) {
        const { rollNo, email, bankAccountNumber, nationalIdCardNo, birthCertificateNumber } = studentDto;

        const duplicateEmailMsg = {
            field: 'email',
            message: 'Student with this email already exists'
        };

        const duplicateRollNoMsg = {
            field: 'rollNo',
            message: 'Student with this rollNo already exists'
        };

        const duplicateNationalIdCardNoMsg = {
            field: 'nationalIdCardNo',
            message: 'Student with this nationalIdCardNo already exists'
        };

        const duplicateBankAccountNumberMsg = {
            field: 'bankAccountNumber',
            message: 'Student with this bankAccountNumber already exists'
        };

        const existingStudent = await this.getRepository(Student).createQueryBuilder('student')
            .where(new Brackets(qb => {
                qb.where([
                    { email },
                    { rollNo },
                    { bankAccountNumber },
                    { nationalIdCardNo },
                    { birthCertificateNumber }
                ])
                student?.id && qb.andWhere({ id: Not(student.id) })
            })).getOne();

        if (existingStudent && !student) {
            if (existingStudent.email === email) throw new ConflictException(duplicateEmailMsg);
            if (existingStudent.rollNo === rollNo) throw new ConflictException(duplicateRollNoMsg);
            if (existingStudent.nationalIdCardNo === nationalIdCardNo) throw new ConflictException(duplicateNationalIdCardNoMsg);
            if (existingStudent.bankAccountNumber === bankAccountNumber) throw new ConflictException(duplicateBankAccountNumberMsg);
            if (existingStudent.birthCertificateNumber === birthCertificateNumber) throw new ConflictException(duplicateBankAccountNumberMsg);
        } else if (existingStudent && student) {
            if (existingStudent.email === email && existingStudent.id !== student.id) throw new ConflictException(duplicateEmailMsg);
            if (existingStudent.nationalIdCardNo === nationalIdCardNo && existingStudent.id !== student.id) throw new ConflictException(duplicateNationalIdCardNoMsg);
            if (existingStudent.rollNo === rollNo && existingStudent.id !== student.id) throw new ConflictException(duplicateRollNoMsg);
            if (existingStudent.bankAccountNumber === bankAccountNumber && existingStudent.id !== student.id) throw new ConflictException(duplicateBankAccountNumberMsg);
            if (existingStudent.birthCertificateNumber === birthCertificateNumber && existingStudent.id !== student.id) throw new ConflictException(duplicateBankAccountNumberMsg);
        }
    }

    async getStudentsWithAttendance(queryDto: StudentAttendanceQueryDto) {
        const currentAcademicYearId = await this.utilitiesService.getAcademicYearId();

        const queryBuilder = this.getRepository(Student).createQueryBuilder('student')
            .innerJoin("student.enrollments", "enrollments", "enrollments.academicYearId = :academicYearId", { academicYearId: currentAcademicYearId })
            .leftJoin("student.account", "account")
            .leftJoin("enrollments.classRoom", "classRoom")
            .leftJoin("classRoom.parent", "parent")
            .leftJoinAndMapOne(
                "student.attendance",
                Attendance,
                "attendance",
                "attendance.accountId = account.id AND DATE(attendance.date) = DATE(:attendanceDate)",
                { attendanceDate: queryDto.date }
            )
            .andWhere(new Brackets((qb) => {
                queryDto.classRoomId && qb.andWhere('classRoom.id = :classRoomId OR parent.id = :classRoomId', { classRoomId: queryDto.classRoomId });
                queryDto.sectionId && qb.andWhere('classRoom.id = :sectionId', { sectionId: queryDto.sectionId });
            }))
            .select([
                "student.id",
                "student.firstName",
                "student.lastName",
                "student.rollNo",
                "account.id",
                "attendance.id",
                "attendance.status",
                "attendance.date"
            ])
            .orderBy("student.rollNo", "ASC")

        const studentsWithAttendance = await this.utilitiesService.applyBranchFilter(queryBuilder).getMany();

        return studentsWithAttendance;
    }

    async getPastStudents(queryDto: PastStudentsQueryDto) {
        const queryBuilder = this.getRepository(Student).createQueryBuilder('student')
            .offset(queryDto.skipPagination ? undefined : queryDto.skip)
            .limit(queryDto.skipPagination ? undefined : queryDto.take)
            .orderBy('student.rollNo', 'ASC')
            .leftJoin('student.classRoom', 'classRoom')
            .leftJoin('classRoom.parent', 'parent')
            .leftJoin('student.account', 'account')
            .leftJoin(
                // Subquery to get the latest enrollment using ROW_NUMBER, don't touch this sub query
                qb => qb
                    .select('enrollment.studentId', 'studentId')
                    .addSelect('enrollment.id', 'id')
                    .addSelect('enrollment.academicYearId', 'academicYearId')
                    .addSelect('ROW_NUMBER() OVER (PARTITION BY enrollment.studentId ORDER BY enrollment.createdAt DESC) AS rowNumber')
                    .from('enrollment', 'enrollment'),
                'latestEnrollment',
                'latestEnrollment.studentId = student.id AND latestEnrollment.rowNumber = 1' // Filter to only include the latest enrollment
            )
            .where('latestEnrollment.academicYearId = :academicYearId', { academicYearId: queryDto.academicYearId }) // ensure academic year match
            .andWhere(new Brackets(qb => {
                if (queryDto.search) {
                    qb.andWhere(new Brackets(subQb => {
                        subQb.orWhere("account.lowerCasedFullName LIKE LOWER(:search)", { search: `${queryDto.search}%` })
                            .orWhere("student.studentId = :exactSearch", { exactSearch: queryDto.search });
                    }));
                }
                queryDto.facultyId && qb.andWhere('classRoom.facultyId = :facultyId', { facultyId: queryDto.facultyId });
                queryDto.classRoomId && !queryDto.sectionId && qb.andWhere('parent.id = :classRoomId OR classRoom.id = :classRoomId', { classRoomId: queryDto.classRoomId });
                queryDto.sectionId && qb.andWhere('classRoom.id = :sectionId', { sectionId: queryDto.sectionId });
            }))
            .select([
                "student.id AS id",
                "CONCAT(student.firstName, ' ', student.lastName) AS fullName",
                "student.rollNo AS rollNo",
                "student.studentId AS studentId",
                "CASE WHEN parent.id IS NULL THEN classRoom.name ELSE CONCAT(parent.name, ' - ', classRoom.name) END AS classRoomName",
                "latestEnrollment.id AS enrollmentId",
                "latestEnrollment.academicYearId as enrollmentAcademicYearId",
                "classRoom.id AS classRoomId",
                "parent.id AS parentId",
            ]);

        this.utilitiesService.applyBranchFilter(queryBuilder);

        return paginatedRawData(queryDto, queryBuilder);
    }

    async getFeeStudent(studentId: string) {
        const currentAcademicYearId = await this.utilitiesService.getAcademicYearId();
        const isPk = isUUID(studentId); // this is done to check if the studentId is a uuid, pk has indexing

        const studentQueryBuilder = this.getRepository(Student).createQueryBuilder('student')
            .innerJoin("student.enrollments", "enrollments", "enrollments.academicYearId = :academicYearId", { academicYearId: currentAcademicYearId })
            .leftJoin('enrollments.classRoom', 'classRoom')
            .leftJoin("classRoom.parent", "parent")
            .leftJoin("student.routeStop", "routeStop")
            .leftJoin("enrollments.ledger", "ledger")
            .leftJoin("student.account", "account")
            .leftJoin("account.profileImage", "profileImage")
            .where(isPk ? "student.id = :studentId" : "student.studentId = :studentId", { studentId })
            .select([
                "student.id AS id",
                "student.studentId AS studentId",
                "CONCAT(student.firstName, ' ', student.lastName) AS name",
                "enrollments.rollNo AS rollNo",
                "enrollments.oneTimeChargeIds as oneTimeChargeIds",
                "student.phone AS phone",
                "student.email AS email",
                "profileImage.url AS profileImageUrl",
                "routeStop.fare AS transportationFare",
                "routeStop.id AS routeStopId",
                "CASE WHEN parent.id IS NULL THEN classRoom.name ELSE CONCAT(parent.name, ' - ', classRoom.name) END AS classRoomName",
                "CASE WHEN parent.id IS NULL THEN classRoom.id ELSE parent.id END AS classRoomId",
                "ledger.id AS ledgerId",
                "ledger.amount AS previousDue",
            ])
            .groupBy('student.id')
            .addGroupBy('classRoom.id')
            .addGroupBy('enrollments.rollNo')
            .addGroupBy('enrollments.oneTimeChargeIds')
            .addGroupBy('ledger.id')

        const student = await this.utilitiesService.applyBranchFilter(studentQueryBuilder).getRawOne();

        if (!student || !student.classRoomName) throw new NotFoundException('Student not found');
        if (!student.ledgerId) throw new InternalServerErrorException('Ledger associated with student not found');

        const lastInvoice = await this.getRepository(FeeInvoice).createQueryBuilder('feeInvoice')
            .leftJoin('feeInvoice.ledgerItem', 'ledgerItem')
            .leftJoin('ledgerItem.studentLedger', 'studentLedger')
            .where('studentLedger.id = :studentLedgerId', { studentLedgerId: student.ledgerId })
            .andWhere('ledgerItem.type = :type', { type: ELedgerItemType.Invoice }) // ensure only fee invoice is returned not fine
            .orderBy('feeInvoice.createdAt', 'DESC')
            .limit(1)
            .select([
                'feeInvoice.month as lastMonth',
            ]).getRawOne();

        const feeStructures: {
            amount: number;
            chargeHeadId: string;
        }[] = await this.getRepository(FeeStructure).createQueryBuilder('feeStructure')
            .leftJoin('feeStructure.chargeHead', 'chargeHead')
            .where('feeStructure.classRoomId = :classRoomId', { classRoomId: student.classRoomId })
            .select([
                'feeStructure.amount AS amount',
                'chargeHead.id AS chargeHeadId',
            ])
            .getRawMany();

        const oneTimeChargeIds = student.oneTimeChargeIds ?? '';

        const chargeHeads: {
            id: string;
            name: string;
            required: string;
        }[] = await this.getRepository(ChargeHead).createQueryBuilder('chargeHead')
            .orderBy('chargeHead.createdAt', 'ASC')
            .where( // filtering out the already charged charge heads that is one time
                oneTimeChargeIds
                    ? `NOT FIND_IN_SET(chargeHead.id, :oneTimeChargeIds)`
                    : '1=1',
                { oneTimeChargeIds: student.oneTimeChargeIds ?? '' }
            )
            .andWhere("chargeHead.type = :type", { type: EChargeHeadType.Regular }) // initially send only the regular charges
            .andWhere("chargeHead.name != :libraryFine", { libraryFine: CHARGE_HEADS.libraryFine })
            .select([
                'chargeHead.id as id',
                'chargeHead.name as name',
                `CASE WHEN chargeHead.name = :monthlyFeeName THEN 'true' ELSE 'false' END as required`, // specifying requried field for monthly fee structure
                'chargeHead.period as period',
            ])
            .setParameter('monthlyFeeName', CHARGE_HEADS.monthlyFee)
            .orderBy('chargeHead.order', 'ASC')
            .getRawMany();

        // if student has a route stop, add transportation fee as required and with amount in feeStructures
        return {
            student: {
                ...student,
                lastMonth: lastInvoice?.lastMonth ?? '0',
            },
            feeStructures: !student.routeStopId
                ? feeStructures
                : [
                    ...feeStructures,
                    {
                        amount: student.transportationFare,
                        chargeHeadId: chargeHeads.find(head => head.name === CHARGE_HEADS.transportationFee)?.id,
                    }
                ],
            chargeHeads: !student.routeStopId
                ? chargeHeads.filter(h => h.name !== CHARGE_HEADS.transportationFee)
                : chargeHeads.map(h => h.name === CHARGE_HEADS.transportationFee ? { ...h, required: 'true' } : h),
        };
    }
}