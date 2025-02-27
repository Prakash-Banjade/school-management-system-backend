import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { Enrollment } from './entities/enrollment.entity';
import { Brackets, DataSource } from 'typeorm';
import { AcademicYear } from 'src/academic-years/entities/academic-year.entity';
import { EnrollmentQueryDto } from './dto/enrollment-query.dto';
import { Student } from 'src/students/entities/student.entity';
import { REQUEST } from '@nestjs/core';
import { enrollmentSelectColumns } from './entities/enrollments-select-cols.config';
import { BaseRepository } from 'src/common/repository/base-repository';
import { FastifyRequest } from 'fastify';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import paginatedData from 'src/utils/paginatedData';
import { getRegistrationNumber } from 'src/utils/get-registration-number';
import { AcademicYearsService } from 'src/academic-years/academic-years.service';
import { StudentLedger } from 'src/finance-system/fee-management/student-ledgers/entities/student-ledger.entity';
import { UtilitiesService } from 'src/utilities/utilities.service';
import { ClassRoom } from 'src/class-rooms/entities/class-room.entity';

@Injectable({ scope: Scope.REQUEST })
export class EnrollmentsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly academicYearService: AcademicYearsService,
    private readonly utilitiesService: UtilitiesService
  ) {
    super(dataSource, req);
  }

  async create(createEnrollmentDto: CreateEnrollmentDto) {
    const { isPast, latestAcademicYear } = await this.academicYearService.isPast();
    if (isPast) throw new ForbiddenException('Promotion are only allowed from latest academic year');

    const branchId = this.utilitiesService.getBranchId();

    // check if any of the student is aready enrolled in the academic year or is not begin demoted
    await this.checkIfEnrollmentExists(latestAcademicYear, createEnrollmentDto.studentsWithRollNo.map(student => student.studentId),);

    // fetching students along with their latest enrollment and ledger amount
    const students = await this.getRepository<Student>(Student)
      .createQueryBuilder('student')
      .leftJoin(
        (qb) =>
          qb
            .select('enrollment.id', 'id')
            .addSelect('enrollment.studentId', 'studentId')
            .addSelect('MAX(enrollment.createdAt)', 'maxCreatedAt')
            .addSelect('ledger.amount', 'amount') // Include the ledger amount
            .from(Enrollment, 'enrollment')
            .leftJoin('enrollment.ledger', 'ledger') // Join with ledger
            .groupBy('enrollment.studentId'),
        'latestEnrollment',
        'latestEnrollment.studentId = student.id'
      )
      .leftJoinAndMapOne(
        'student.latestEnrollment',
        Enrollment,
        'enrollment',
        'enrollment.id = latestEnrollment.id'
      )
      .leftJoin('student.account', 'account')
      .whereInIds(createEnrollmentDto.studentsWithRollNo.map(student => student.studentId)) // Filter by student IDs
      .andWhere(
        new Brackets((qb) => {
          if (branchId) {
            qb.andWhere('account.branchId = :branchId', { branchId });
          }
        })
      )
      .select([
        'student.id AS id',
        'student.academicYearIds AS academicYearIds',
        'latestEnrollment.amount AS ledgerAmount',
      ])
      .getRawMany();

    if (students.length !== createEnrollmentDto.studentsWithRollNo?.length) throw new NotFoundException('Student not found');

    const newClassRoom = await this.getRepository(ClassRoom).findOne({
      where: {
        id: createEnrollmentDto.classRoomId,
        branch: { id: branchId }
      },
      select: { id: true }
    });
    if (!newClassRoom) throw new NotFoundException('Class room not found');

    // create the enrollment
    const enrollments = this.getRepository<Enrollment>(Enrollment).create(students.map((student, ind) => ({
      student: { id: student.id } as unknown as Student,
      classRoom: newClassRoom,
      academicYear: latestAcademicYear,
      enrollmentDate: createEnrollmentDto.enrollmentDate,
      registrationNumber: getRegistrationNumber(latestAcademicYear),
      rollNo: createEnrollmentDto.studentsWithRollNo[ind].newRollNo,
      ledger: this.getRepository<StudentLedger>(StudentLedger).create({
        amount: student.ledgerAmount ?? 0,
      })
    })));

    await this.getRepository<Enrollment>(Enrollment).save(enrollments);

    // update student classroom
    const promotedStudents: Student[] = students.map((student, ind) => {
      student.classRoom = newClassRoom;
      student.academicYearIds = [...(student.academicYearIds ?? []), latestAcademicYear.id];
      student.rollNo = createEnrollmentDto.studentsWithRollNo[ind].newRollNo;
      return student;
    });

    await this.getRepository<Student>(Student).save(promotedStudents);

    return { message: "Promotion Successful" }
  };

  private async checkIfEnrollmentExists(academicYear: AcademicYear, studentIds: string[],) {
    const existingEnrollment = await this.getRepository<Enrollment>(Enrollment).createQueryBuilder('enrollment')
      .where("enrollment.academicYearId = :academicYearId", { academicYearId: academicYear.id })
      .leftJoin('enrollment.student', 'student')
      .andWhere("student.id IN (:...studentIds)", { studentIds })
      .select(['enrollment.id', 'student.firstName', 'student.lastName'])
      .getOne();

    const studentName = `${existingEnrollment?.student?.firstName} ${existingEnrollment?.student?.lastName}`;

    if (existingEnrollment) throw new ConflictException(`Enrollment of ${studentName} already exists`);
  }

  async findAll(queryDto: EnrollmentQueryDto) {
    const queryBuilder = this.getRepository<Enrollment>(Enrollment).createQueryBuilder('enrollment');

    queryBuilder
      .orderBy('enrollment.createdAt', queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .leftJoin('enrollment.student', 'student')
      .leftJoin('enrollment.classRoom', 'classRoom')
      .leftJoin('classRoom.faculty', 'faculty')
      .leftJoin('classRoom.parent', 'parent')
      .leftJoin('enrollment.academicYear', 'academicYear')
      .where(new Brackets(qb => {
        queryDto.search && qb.orWhere(`CONCAT(student.firstName, ' ', student.lastName) LIKE :search`, { search: `%${queryDto.search}%` })
          .orWhere('TRIM(enrollment.registrationNumber) = TRIM(:exactSearch)', { exactSearch: queryDto.search });

        queryDto.facultyId && qb.andWhere('faculty.id = :facultyId', { facultyId: queryDto.facultyId });
        queryDto.classRoomId && qb.andWhere('classRoom.id = :classRoomId OR parent.id = :classRoomId', { classRoomId: queryDto.classRoomId });
        queryDto.sectionId && qb.andWhere('classRoom.id = :sectionId', { sectionId: queryDto.sectionId });
      }))

    applySelectColumns(queryBuilder, enrollmentSelectColumns, 'enrollment');
    this.utilitiesService.applyBranchFilter(queryBuilder, "classRoom.branchId = :branchId");

    return paginatedData(queryDto, queryBuilder);
  }
}
