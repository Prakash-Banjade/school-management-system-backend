import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentClassDto, UpdateStudentDto } from './dto/update-student.dto';
import { Student } from './entities/student.entity';
import { DataSource } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { singleStudentColumnsConfig } from './helpers/studentsColumnsConfig';
import { DormitoryRoomsService } from 'src/dormitory-system/dormitory-rooms/dormitory-rooms.service';
import { BaseRepository } from 'src/common/repository/base-repository';
import { ImagesService } from 'src/file-management/images/images.service';
import { AccountsService } from 'src/auth-system/accounts/accounts.service';
import { FastifyRequest } from 'fastify';
import { StudentsHelper } from './helpers/students.helper';
import { AuthUser, EClassType } from 'src/common/types/global.type';
import { FilesService } from 'src/file-management/files/files.service';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { AcademicYear } from 'src/academic-years/entities/academic-year.entity';
import { getRegistrationNumber } from 'src/utils/get-registration-number';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CACHE_KEYS } from 'src/common/CONSTANTS';
import { RouteStopsService } from 'src/transportation-system/route-stops/route-stops.service';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { StudentLedger } from 'src/finance-system/fee-management/student-ledgers/entities/student-ledger.entity';
import { ClassRoom } from 'src/class-rooms/entities/class-room.entity';
import { AcademicYearsService } from 'src/academic-years/academic-years.service';

@Injectable({ scope: Scope.REQUEST })
export class StudentsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly imageService: ImagesService,
    private readonly filesService: FilesService,
    private readonly accountsService: AccountsService,
    private dormitoryRoomsService: DormitoryRoomsService,
    private readonly studentsHelper: StudentsHelper,
    private readonly routeStopsService: RouteStopsService,
    private readonly academicYearService: AcademicYearsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super(dataSource, req);
  }

  async create(createStudentDto: CreateStudentDto, currentUser: AuthUser) {
    await this.studentsHelper.checkIfStudentExists(createStudentDto);

    // evaluate class room
    const classRoom = await this.getRepository(ClassRoom).findOne({
      where: { id: createStudentDto.classRoomId },
      relations: { children: true },
      select: { id: true, classType: true, children: { id: true } }
    });
    if (!classRoom) throw new NotFoundException('Class room not found');
    if (classRoom.classType === EClassType.PRIMARY && classRoom.children?.length > 0) { // if there are class sections, then section is needed
      throw new BadRequestException('Please select section');
    }

    // evaluate profile image
    const profileImage = createStudentDto.profileImageId
      ? await this.imageService.findOne(createStudentDto.profileImageId)
      : null;

    // evaluate document attachments
    const documentAttachments = createStudentDto.documentAttachmentIds
      ? await this.filesService.findAllByIds(createStudentDto.documentAttachmentIds)
      : null;

    // evaluate dormitory room
    const dormitoryRoom = createStudentDto.dormitoryRoomId
      ? await this.dormitoryRoomsService.findOneWithAvailableBed(createStudentDto.dormitoryRoomId)
      : null;

    // evaluate routeStop
    const routeStop = createStudentDto.routeStopId
      ? await this.routeStopsService.findOneWithAvailableSeats(createStudentDto.routeStopId)
      : null;

    const academicYear = await this.getRepository<AcademicYear>(AcademicYear).findOne({ // enroll in current academic year
      where: { isActive: true },
      select: { id: true }
    });
    if (!academicYear) throw new ForbiddenException('No active academic year');

    const enrollment = this.getRepository<Enrollment>(Enrollment).create({
      classRoom,
      academicYear,
      enrollmentDate: createStudentDto.admissionDate,
      rollNo: createStudentDto.rollNo,
      registrationNumber: getRegistrationNumber(academicYear),
      ledger: this.getRepository<StudentLedger>(StudentLedger).create(),
    });

    const newStudent = this.getRepository<Student>(Student).create({
      ...createStudentDto,
      profileImage,
      classRoom,
      documentAttachments,
      dormitoryRoom,
      academicYearIds: [academicYear.id],
      enrollments: [enrollment], // enrollment is created automatically due to cascading
      routeStop,
    });

    const savedStudent = await this.getRepository<Student>(Student).save(newStudent);

    // CREATE ACCOUNT
    await this.accountsService.createAccount(savedStudent, currentUser);

    return { message: 'Student created' }
  }

  async findOne(id: string) {
    const currentAcademicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

    const querybuilder = this.getRepository<Student>(Student).createQueryBuilder('student')
      .leftJoin('student.account', 'account')
      .leftJoin('student.profileImage', 'profileImage')
      .leftJoin('student.enrollments', 'enrollments')
      .leftJoin('enrollments.classRoom', 'classRoom')
      .leftJoin('classRoom.parent', 'parent')
      .leftJoin('student.guardians', 'guardians')
      .leftJoin('student.dormitoryRoom', 'dormitoryRoom')
      .leftJoin('student.documentAttachments', 'documentAttachments')
      .leftJoin('student.routeStop', 'routeStop')
      .leftJoin('routeStop.vehicle', 'vehicle')
      .where('student.id = :id', { id })
      .andWhere("enrollments.academicYearId = :academicYearId", { academicYearId: currentAcademicYearId })

    applySelectColumns(querybuilder, singleStudentColumnsConfig, 'student');

    const existing = await querybuilder.getOne();

    if (!existing) throw new NotFoundException('Student not found')

    // map the enrollment classroom to the student classroom
    existing.classRoom = existing.enrollments[0].classRoom;
    existing.rollNo = existing.enrollments[0].rollNo;
    delete existing.enrollments;

    return existing;
  }

  async findLibraryStudent(studentId: string, currentUser: AuthUser) {
    const currentAcademicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

    const student = await this.getRepository<Student>(Student).createQueryBuilder('student')
      .leftJoin("student.enrollments", "enrollments", "enrollments.academicYearId = :academicYearId", { academicYearId: currentAcademicYearId })
      .leftJoin('enrollments.classRoom', 'classRoom')
      .leftJoin("classRoom.parent", "parent")
      .leftJoin("student.profileImage", "profileImage")
      .leftJoin("student.bookTransactions", "bookTransactions")
      .leftJoin("student.account", "account")
      .where("student.studentId = :studentId", { studentId })
      .andWhere('account.branchId = :branchId', { branchId: currentUser.branchId })
      .select([
        "student.id AS id",
        "CONCAT(student.firstName, ' ', student.lastName) AS name",
        "student.rollNo AS rollNo",
        "student.phone AS phone",
        "student.email AS email",
        "profileImage.url AS profileImageUrl",
        "CASE WHEN parent.id IS NULL THEN classRoom.name ELSE CONCAT(parent.name, ' - ', classRoom.name) END AS classRoomName",
        "COUNT(bookTransactions.id) AS transactionCount"
      ])
      .groupBy('student.id')
      .addGroupBy('classRoom.id')
      .getRawOne();

    if (!student || !student.classRoomName) throw new NotFoundException('Student not found');

    return student;
  }

  async update(id: string, updateStudentDto: UpdateStudentDto) {
    const existing = await this.findOne(id);
    const currentAcademicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

    // check if credentials are already taken
    await this.studentsHelper.checkIfStudentExists(updateStudentDto, existing);

    // evaluate profile image, since one-to-one relation, we need to remove the existing one first
    if (existing.profileImage?.id && updateStudentDto.profileImageId !== undefined) {
      await this.imageService.update(existing.profileImage.id, updateStudentDto.profileImageId);
    } else if (updateStudentDto.profileImageId !== undefined) { // this will execute only when student has no profile image before
      existing.profileImage = updateStudentDto.profileImageId ? await this.imageService.findOne(updateStudentDto.profileImageId) : null;
    }

    // evaluate document attachments
    const documentAttachments = updateStudentDto.documentAttachmentIds
      ? await this.filesService.findAllByIds(updateStudentDto.documentAttachmentIds)
      : existing.documentAttachments;

    // evaluate dormitory room
    if (updateStudentDto.dormitoryRoomId && (updateStudentDto.dormitoryRoomId !== existing.dormitoryRoom?.id || !existing.dormitoryRoom)) {
      // set new dormitory room
      existing.dormitoryRoom = await this.dormitoryRoomsService.findOneWithAvailableBed(updateStudentDto.dormitoryRoomId);
    } else if (updateStudentDto.dormitoryRoomId === null) {
      // unsetting dormitory room
      existing.dormitoryRoom = null;
    }

    // evaluate routeStop
    if (updateStudentDto.routeStopId && (updateStudentDto.routeStopId !== existing.routeStop?.id || !existing.routeStop)) {
      // set new dormitory room
      existing.routeStop = await this.routeStopsService.findOneWithAvailableSeats(updateStudentDto.routeStopId);
    } else if (updateStudentDto.routeStopId === null) {
      // unsetting dormitory room
      existing.routeStop = null;
    }

    // update email if provided
    if (updateStudentDto.email && existing.email !== updateStudentDto.email) {
      await this.accountsService.updateEmail(existing.account?.id, updateStudentDto.email);
    }

    Object.assign(existing, {
      ...updateStudentDto,
      documentAttachments,
    });

    await this.getRepository<Student>(Student).save(existing);

    // update roll no in enrollment
    if (updateStudentDto.rollNo && existing.rollNo !== updateStudentDto.rollNo) {
      const updatedEnrollment = await this.getRepository<Enrollment>(Enrollment).createQueryBuilder()
        .update(Enrollment)
        .set({ rollNo: updateStudentDto.rollNo })
        .where("studentId = :studentId", { studentId: existing.id })
        .andWhere("academicYearId = :academicYearId", { academicYearId: currentAcademicYearId })
        .execute();

      if (updatedEnrollment.affected === 0) throw new NotFoundException('Student not found');
    }

    return { message: 'Student updated' }
  }

  async updateClassRoom(updateStudentClassDto: UpdateStudentClassDto) {
    // check if performing this action from past academic year
    const { isPast } = await this.academicYearService.isPast();
    if (isPast) throw new ForbiddenException('Cannot perform this action from past academic year');

    const classRoom = await this.getRepository(ClassRoom).findOne({
      where: { id: updateStudentClassDto.classRoomId },
      relations: { children: true },
      select: { id: true, classType: true, children: { id: true } }
    });
    if (!classRoom) throw new NotFoundException('Class room not found');

    if (classRoom.classType === EClassType.PRIMARY && classRoom.children?.length > 0) { // if there are class sections, then section is needed
      throw new BadRequestException('Please select section');
    }

    const queryBuilder = this.getRepository<Student>(Student).createQueryBuilder()
      .update(Student)
      .set({ classRoom: classRoom })
      .where("FIND_IN_SET(:currentAcademicYearId, student.academicYearIds) > 0", { currentAcademicYearId: await this.cacheManager.get(CACHE_KEYS.CAY_ID) })
      .andWhere("student.id IN (:...studentIds)", { studentIds: updateStudentClassDto.studentIds });

    const result = await queryBuilder.execute();

    if (result.affected === 0) throw new NotFoundException('Student not found');

    // update the enrollment also
    const enrollmentQuerybuilder = this.getRepository<Enrollment>(Enrollment).createQueryBuilder()
      .update(Enrollment)
      .set({ classRoom: classRoom })
      .where("academicYearId = :currentAcademicYearId", { currentAcademicYearId: await this.cacheManager.get(CACHE_KEYS.CAY_ID) })
      .andWhere("studentId IN (:...studentIds)", { studentIds: updateStudentClassDto.studentIds });

    const enrollmentResult = await enrollmentQuerybuilder.execute();

    if (enrollmentResult.affected === 0) throw new NotFoundException('Unable to update enrollment');

    return {
      message: 'Class Updated',
    }
  }

  async remove(id: string) {
    const existing = await this.findOne(id)

    await this.getRepository<Student>(Student).remove(existing)

    return { message: 'Student deleted' }
  }
}
