import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Brackets, DataSource, Not, Repository } from "typeorm";
import { Student } from "../entities/student.entity";
import { PastStudentsQueryDto, StudentAttendanceQueryDto, StudentQueryDto, StudentSortBy } from "../dto/student-query.dto";
import { CreateStudentDto } from "../dto/create-student.dto";
import { UpdateStudentDto } from "../dto/update-student.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Attendance } from "src/attendances/entities/attendance.entity";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { CACHE_KEYS, CHARGE_HEADS } from "src/common/CONSTANTS";
import { paginatedRawData } from "src/utils/paginatedData";
import { BaseRepository } from "src/common/repository/base-repository";
import { REQUEST } from "@nestjs/core";
import { FastifyRequest } from "fastify";
import { FeeStructure } from "src/finance-system/fee-management/fee-structures/entities/fee-structure.entity";
import { ChargeHead, EChargeHeadPeriod, EChargeHeadType } from "src/finance-system/fee-management/charge-heads/entities/charge-head.entity";
import { FeeInvoice } from "src/finance-system/fee-management/fee-invoice/entities/fee-invoice.entity";

@Injectable()
export class StudentsHelper extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) private req: FastifyRequest,
        @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { super(dataSource, req); }

    async findAll(queryDto: StudentQueryDto) {
        const academicYearId = queryDto.academicYearId || await this.cacheManager.get(CACHE_KEYS.CAY_ID);

        const queryBuilder = this.studentRepo.createQueryBuilder('student')
            .offset(queryDto.skipPagination ? undefined : queryDto.skip)
            .limit(queryDto.skipPagination ? undefined : queryDto.take)
            .addSelect("CONCAT(student.firstName, ' ', student.lastName) AS fullName")
            .orderBy(this.getOrderByKey(queryDto), queryDto.order)
            .leftJoin('student.routeStop', 'routeStop', queryDto.onlyBasicInfo ? '1 = 0' : '1 = 1') // only basic info will not have route stop
            .leftJoin('student.enrollments', 'enrollments')
            .leftJoin('enrollments.ledger', 'ledger', queryDto.includeLedgerAmount ? '1 = 1' : '1 = 0')
            .leftJoin('enrollments.classRoom', 'classRoom')
            .leftJoin('classRoom.parent', 'parent')
            .leftJoin('student.profileImage', 'profileImage', queryDto.onlyBasicInfo ? '1 = 0' : '1 = 1') // only basic info will not have profile image
            .where("enrollments.academicYearId = :academicYearId", { academicYearId: academicYearId })
            .andWhere(new Brackets(qb => {
                if (queryDto.search) {
                    qb.andWhere(new Brackets(subQb => {
                        subQb.orWhere("LOWER(CONCAT(student.firstName, ' ', student.lastName)) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
                            .orWhere("LOWER(student.email) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
                            .orWhere("TRIM(student.studentId) = TRIM(:exactSearch)", { exactSearch: queryDto.search })
                    }))
                }
                queryDto.studentId && qb.andWhere('student.studentId = :studentId', { studentId: queryDto.studentId });

                queryDto.classRoomId && qb.andWhere(new Brackets(qb => { // if class room id, check in both section and class
                    qb.orWhere('parent.id = :classRoomId', { classRoomId: queryDto.classRoomId });
                    qb.orWhere('classRoom.id = :classRoomId', { classRoomId: queryDto.classRoomId });
                }))

                queryDto.sectionId && qb.andWhere('classRoom.id = :sectionId', { sectionId: queryDto.sectionId }); // the sectionId send by the frontend is the class room id
            }))
            .select(
                queryDto.includeLedgerAmount ? [
                    ...this.getStudentsSelectCols(queryDto.onlyBasicInfo),
                    "ledger.amount as ledgerAmount"
                ] : this.getStudentsSelectCols(queryDto.onlyBasicInfo)
            );

        return paginatedRawData(queryDto, queryBuilder);
    }

    private getStudentsSelectCols(onlyBasicInfo: boolean) {
        const basicCols = [
            "student.id as id",
            "CONCAT(student.firstName, ' ', student.lastName) AS fullName",
            "enrollments.rollNo as rollNo",
            "student.studentId as studentId",
            "CASE WHEN parent.id IS NULL THEN classRoom.name ELSE CONCAT(parent.name, ' - ', classRoom.name) END AS classRoomName",
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
            ]
    }

    private getOrderByKey(queryDto: StudentQueryDto) {
        switch (queryDto.sortBy) {
            case StudentSortBy.NAME: {
                return 'fullName';
            }
            case StudentSortBy.ROLL_NO: {
                return 'student.rollNo';
            }
            case StudentSortBy.STUDENT_ID: {
                return 'student.studentId';
            }
            case StudentSortBy.GENDER: {
                return 'student.gender';
            }
            case StudentSortBy.DOB: {
                return 'student.dob';
            }
            case StudentSortBy.LEDGER_AMOUNT: {
                return 'ledger.amount';
            }
            default: {
                return 'student.createdAt';
            }
        }
    }

    async checkIfStudentExists(studentDto: CreateStudentDto | UpdateStudentDto, student?: Student) {
        const { rollNo, email, bankAccountNumber, nationalIdCardNo } = studentDto;

        const existingStudent = await this.studentRepo.createQueryBuilder('student')
            .where(new Brackets(qb => {
                qb.where([
                    { email },
                    { rollNo },
                    { bankAccountNumber }
                ])
                student?.id && qb.andWhere({ id: Not(student.id) })
            })).getOne();

        if (existingStudent && !student) {
            if (existingStudent.email === email) throw new BadRequestException('Student with this email already exists');
            if (existingStudent.nationalIdCardNo === nationalIdCardNo) throw new BadRequestException('Student with this nationalIdCardNo already exists');
            if (existingStudent.bankAccountNumber === bankAccountNumber) throw new BadRequestException('Student with this bankAccountNumber already exists');
        } else if (existingStudent && student) {
            if (existingStudent.email === email && existingStudent.id !== student.id) throw new BadRequestException('Student with this email already exists');
            if (existingStudent.nationalIdCardNo === nationalIdCardNo && existingStudent.id !== student.id) throw new BadRequestException('Student with this nationalIdCardNo already exists');
            if (existingStudent.bankAccountNumber === bankAccountNumber && existingStudent.id !== student.id) throw new BadRequestException('Student with this bankAccountNumber already exists');
        }
    }

    async getStudentsWithAttendance(queryDto: StudentAttendanceQueryDto) {
        const currentAcademicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

        const studentsWithAttendance = await this.studentRepo.createQueryBuilder('student')
            .leftJoin("student.enrollments", "enrollments")
            .leftJoin("student.account", "account")
            .leftJoin("enrollments.classRoom", "classRoom")
            .leftJoinAndMapOne(
                "student.attendance",
                Attendance,
                "attendance",
                "attendance.accountId = account.id AND DATE(attendance.date) = :attendanceDate",
                { attendanceDate: new Date(queryDto.date).toISOString().split('T')[0] }
            )
            .where("enrollments.academicYearId = :academicYearId", { academicYearId: currentAcademicYearId })
            .andWhere(new Brackets((qb) => {
                if (!queryDto.sectionId) {
                    qb.where("classRoom.id = :classroomId", { classroomId: queryDto.classRoomId }); // if section id is not present look for class room id
                } else {
                    qb.andWhere("classRoom.id = :sectionId", { sectionId: queryDto.sectionId }); // if section id is present look for section id
                }
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
            .getMany();

        return studentsWithAttendance;

    }

    async getPastStudents(queryDto: PastStudentsQueryDto) {
        const queryBuilder = this.studentRepo.createQueryBuilder('student')
            .offset(queryDto.skipPagination ? undefined : queryDto.skip)
            .limit(queryDto.skipPagination ? undefined : queryDto.take)
            .orderBy('student.rollNo', 'ASC')
            .leftJoin('student.classRoom', 'classRoom')
            .leftJoin('classRoom.parent', 'parent')
            .leftJoin(
                // Subquery to get the latest enrollment using ROW_NUMBER
                qb => qb
                    .select('enrollment.studentId', 'studentId')
                    .addSelect('enrollment.id', 'id')
                    .addSelect('enrollment.academicYearId', 'academicYearId')
                    .addSelect('ROW_NUMBER() OVER (PARTITION BY enrollment.studentId ORDER BY enrollment.createdAt DESC) AS rowNumber')
                    .from('enrollment', 'enrollment'),
                'latestEnrollment',
                'latestEnrollment.studentId = student.id AND latestEnrollment.rowNumber = 1' // Filter to only include the latest enrollment
            )
            .andWhere(new Brackets(qb => {
                if (queryDto.search) {
                    qb.andWhere(new Brackets(subQb => {
                        subQb.orWhere("LOWER(CONCAT(student.firstName, ' ', student.lastName)) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
                            .orWhere("LOWER(student.email) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
                            .orWhere("TRIM(student.studentId) = TRIM(:exactSearch)", { exactSearch: queryDto.search });
                    }));
                }

                queryDto.studentId && qb.andWhere('student.studentId = :studentId', { studentId: queryDto.studentId });

                queryDto.classRoomId && qb.andWhere('parent.id = :classRoomId OR classRoom.id = :classRoomId', { classRoomId: queryDto.classRoomId });
                queryDto.sectionId && qb.andWhere('classRoom.id = :sectionId', { sectionId: queryDto.sectionId });

                // Add filter for academicYearId
                queryDto.academicYearId && qb.andWhere('latestEnrollment.academicYearId = :academicYearId', { academicYearId: queryDto.academicYearId });
            }))
            .select([
                "student.id AS id",
                "CONCAT(student.firstName, ' ', student.lastName) AS fullName",
                "student.rollNo AS rollNo",
                "student.studentId AS studentId",
                "CASE WHEN parent.id IS NULL THEN classRoom.name ELSE CONCAT(parent.name, ' - ', classRoom.name) END AS classRoomName",
                "latestEnrollment.id AS enrollmentId",
            ]);



        return paginatedRawData(queryDto, queryBuilder);
    }

    async getFeeStudent(studentId: string) {
        const currentAcademicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

        const student = await this.studentRepo.createQueryBuilder('student')
            .leftJoin("student.enrollments", "enrollments", "enrollments.academicYearId = :academicYearId", { academicYearId: currentAcademicYearId })
            .leftJoin('enrollments.classRoom', 'classRoom')
            .leftJoin("classRoom.parent", "parent")
            .leftJoin("student.profileImage", "profileImage")
            .leftJoin("student.routeStop", "routeStop")
            .leftJoin("enrollments.ledger", "ledger")
            .where("student.studentId = :studentId", { studentId })
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
            .getRawOne();

        if (!student || !student.classRoomName) throw new NotFoundException('Student not found');
        if (!student.ledgerId) throw new InternalServerErrorException('Ledger associated with student not found');

        const lastInvoice = await this.getRepository(FeeInvoice).createQueryBuilder('feeInvoice')
            .leftJoin('feeInvoice.ledgerItem', 'ledgerItem')
            .leftJoin('ledgerItem.studentLedger', 'studentLedger')
            .where('studentLedger.id = :studentLedgerId', { studentLedgerId: student.ledgerId })
            .orderBy('feeInvoice.createdAt', 'DESC')
            .limit(1)
            .select([
                'feeInvoice.month as lastMonth',
            ]).getRawOne();

        const oneTimeChargeIds = student.oneTimeChargeIds ?? '';

        const feeStructures: {
            amount: number;
            chargeHeadId: string;
        }[] = await this.getRepository(FeeStructure).createQueryBuilder('feeStructure')
            .leftJoin('feeStructure.chargeHead', 'chargeHead')
            .where('feeStructure.classRoomId = :classRoomId', { classRoomId: student.classRoomId })
            .andWhere("chargeHead.type = :type", { type: EChargeHeadType.Regular }) // initially send only the regular charges
            .andWhere( // filtering out the already charged charge heads that is one time
                oneTimeChargeIds
                    ? `NOT FIND_IN_SET(chargeHead.id, :oneTimeChargeIds)`
                    : '1=1',
                { oneTimeChargeIds: student.oneTimeChargeIds ?? '' }
            )
            .select([
                'feeStructure.amount AS amount',
                'chargeHead.id AS chargeHeadId',
                'chargeHead.name as name',
                `CASE WHEN chargeHead.name = :monthlyFeeName THEN 'true' ELSE 'false' END as required`, // specifying requried field for monthly fee structure
                'chargeHead.period as period',
            ])
            .setParameter('monthlyFeeName', CHARGE_HEADS.monthlyFee)
            .getRawMany();

        const transportationChargeHeadId = await this.getRepository(ChargeHead).createQueryBuilder()
            .where('name = :name', { name: CHARGE_HEADS.transportationFee })
            .select('id')
            .getRawOne();
        if (!transportationChargeHeadId) throw new InternalServerErrorException('Transportation charge head not found');

        return {
            student: {
                ...student,
                lastMonth: lastInvoice.lastMonth ?? '0',
            },
            feeStructures: !student.routeStopId
                ? feeStructures
                : [
                    ...feeStructures,
                    {
                        amount: student.transportationFare,
                        chargeHeadId: transportationChargeHeadId.id,
                        name: CHARGE_HEADS.transportationFee,
                        required: 'true',
                        period: EChargeHeadPeriod.Monthly,
                    }
                ],
        };
    }
}