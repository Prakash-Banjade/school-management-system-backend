import { BadRequestException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentClassDto, UpdateStudentDto } from './dto/update-student.dto';
import { Student } from './entities/student.entity';
import { DataSource } from 'typeorm';
import { StudentQueryDto } from './dto/student-query.dto';
import { ClassRoomsService } from 'src/class-rooms/class-rooms.service';
import { REQUEST } from '@nestjs/core';
import { singleStudentColumnsConfig } from './helpers/studentsColumnsConfig';
import { DormitoryRoomsService } from 'src/dormitory-system/dormitory-rooms/dormitory-rooms.service';
import { BaseRepository } from 'src/common/repository/base-repository';
import { ImagesService } from 'src/file-management/images/images.service';
import { AccountsService } from 'src/auth-system/accounts/accounts.service';
import { FastifyRequest } from 'fastify';
import { StudentsHelper } from './helpers/students.helper';
import { EClassType } from 'src/common/types/global.type';
import { StudentAttendanceQueryDto } from './dto/student-attendance-query.dto';
import { FilesService } from 'src/file-management/files/files.service';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { AcademicYear } from 'src/academic-years/entities/academic-year.entity';
import { getRegistrationNumber } from 'src/utils/get-registration-number';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CACHE_KEYS } from 'src/common/CONSTANTS';
import { RouteStopsService } from 'src/transportation-system/route-stops/route-stops.service';
import { applySelectColumns } from 'src/utils/apply-select-cols';

@Injectable({ scope: Scope.REQUEST })
export class StudentsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly imageService: ImagesService,
    private readonly filesService: FilesService,
    private readonly classRoomsService: ClassRoomsService,
    private readonly accountsService: AccountsService,
    private dormitoryRoomsService: DormitoryRoomsService,
    private readonly studentsHelper: StudentsHelper,
    private readonly routeStopsService: RouteStopsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super(dataSource, req);
  }

  async create(createStudentDto: CreateStudentDto) {
    await this.studentsHelper.checkIfStudentExists(createStudentDto);

    // evaluate class room
    const classRoom = await this.classRoomsService.findOne(createStudentDto.classRoomId);
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
      ? await this.dormitoryRoomsService.findOne(createStudentDto.dormitoryRoomId)
      : null;

    // evaluate routeStop
    const routeStop = createStudentDto.routeStopId
      ? await this.routeStopsService.findOne(createStudentDto.routeStopId)
      : null;

    const academicYear = await this.getRepository<AcademicYear>(AcademicYear).findOneBy({ isActive: true }); // enroll in current academic year

    const enrollment = this.getRepository<Enrollment>(Enrollment).create({
      classRoom,
      academicYear,
      enrollmentDate: createStudentDto.admissionDate,
      rollNo: createStudentDto.rollNo,
      registrationNumber: getRegistrationNumber(academicYear),
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
    await this.accountsService.createAccount(savedStudent);

    return this.studentMutationReturn(savedStudent, 'created');
  }

  async findAll(queryDto: StudentQueryDto) {
    return this.studentsHelper.setQuery(queryDto);
  }

  async findOne(id: string) {
    const currentAcademicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID);

    const querybuilder = this.getRepository<Student>(Student).createQueryBuilder('student')
      .leftJoin('student.account', 'account')
      .leftJoin('student.profileImage', 'profileImage')
      .leftJoin('student.enrollments', 'enrollments', "enrollments.academicYearId = :academicYearId", { academicYearId: currentAcademicYearId })
      .leftJoin('enrollments.classRoom', 'classRoom')
      .leftJoin('classRoom.parent', 'parent')
      .leftJoin('student.guardians', 'guardians')
      .leftJoin('student.dormitoryRoom', 'dormitoryRoom')
      .leftJoin('student.documentAttachments', 'documentAttachments')
      .leftJoin('student.routeStop', 'routeStop')
      .leftJoin('routeStop.vehicle', 'vehicle')
      .where('student.id = :id', { id })

    applySelectColumns(querybuilder, singleStudentColumnsConfig, 'student');

    const existing = await querybuilder.getOne();

    if (!existing) throw new NotFoundException('Student not found')

    // map the enrollment classroom to the student classroom
    existing.classRoom = existing.enrollments[0].classRoom;
    existing.rollNo = existing.enrollments[0].rollNo;
    delete existing.enrollments;

    return existing;
  }

  async findOneByAccountId(accountId: string) {
    const existing = await this.getRepository<Student>(Student).findOne({
      where: { account: { id: accountId } },
      relations: {
        classRoom: {
          parent: true,
        },
        profileImage: true,
        guardians: true,
        dormitoryRoom: true,
        documentAttachments: true,
      },
      select: singleStudentColumnsConfig,
    })
    if (!existing) throw new NotFoundException('Student not found')

    return existing;
  }

  async findLibraryStudent(studentId: string) {
    const currentAcademicYearId = this.cacheManager.get(CACHE_KEYS.CAY_ID);

    const student = await this.getRepository<Student>(Student).createQueryBuilder('student')
      .where("FIND_IN_SET(:currentAcademicYearId, student.academicYearIds) > 0", { currentAcademicYearId })
      .leftJoin("student.profileImage", "profileImage")
      .leftJoin("student.bookTransactions", "bookTransactions")
      .leftJoin("student.classRoom", "classRoom")
      .leftJoin("classRoom.parent", "parent")
      .where("student.studentId = :studentId", { studentId })
      .groupBy("student.id")
      .select([
        "student.id AS id",
        "CONCAT(student.firstName, ' ', student.lastName) AS name",
        "student.rollNo AS rollNo",
        "student.phone AS phone",
        "student.email AS email",
        "profileImage.url AS profileImageUrl",
        "classRoom.name AS classRoom",
        "parent.name AS parentClass",
        "COUNT(bookTransactions.id) AS transactionCount"
      ])
      .getRawOne();

    if (!student) throw new NotFoundException('Student not found');

    return student;
  }

  async getStudentsAttendance(queryDto: StudentAttendanceQueryDto) {
    return this.studentsHelper.getStudentsWithAttendance(queryDto);
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

    /**
    |--------------------------------------------------
    | don't allow to udpate class room
    |--------------------------------------------------
    */

    // evaluate document attachments
    const documentAttachments = updateStudentDto.documentAttachmentIds
      ? await this.filesService.findAllByIds(updateStudentDto.documentAttachmentIds)
      : existing.documentAttachments;

    // evaluate dormitory room
    if (updateStudentDto.dormitoryRoomId && (updateStudentDto.dormitoryRoomId !== existing.dormitoryRoom?.id || !existing.dormitoryRoom)) {
      // set new dormitory room
      existing.dormitoryRoom = await this.dormitoryRoomsService.findOne(updateStudentDto.dormitoryRoomId);
    } else if (updateStudentDto.dormitoryRoomId === null) {
      // unsetting dormitory room
      existing.dormitoryRoom = null;
    }

    // evaluate routeStop
    if (updateStudentDto.routeStopId && (updateStudentDto.routeStopId !== existing.routeStop?.id || !existing.routeStop)) {
      // set new dormitory room
      existing.routeStop = await this.routeStopsService.findOne(updateStudentDto.routeStopId);
    } else if (updateStudentDto.routeStopId === null) {
      // unsetting dormitory room
      existing.routeStop = null;
    }

    Object.assign(existing, {
      ...updateStudentDto,
      documentAttachments,
    });

    const savedStudent = await this.getRepository<Student>(Student).save(existing);

    // update roll no in enrollment
    const updatedEnrollment = await this.getRepository<Enrollment>(Enrollment).createQueryBuilder()
      .update(Enrollment)
      .set({ rollNo: updateStudentDto.rollNo })
      .where("studentId = :studentId", { studentId: existing.id })
      .andWhere("academicYearId = :academicYearId", { academicYearId: currentAcademicYearId })
      .execute();

    if (updatedEnrollment.affected === 0) throw new NotFoundException('Student not found');

    return this.studentMutationReturn(savedStudent, 'updated');
  }

  async updateClassRoom(updateStudentClassDto: UpdateStudentClassDto) {
    const classRoom = await this.classRoomsService.findOne(updateStudentClassDto.classRoomId);

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

    return {
      message: 'Class Updated',
    }
  }

  async remove(id: string) {
    const existing = await this.findOne(id)

    return this.getRepository<Student>(Student).remove(existing)
  }

  private studentMutationReturn = (student: Student, type: 'created' | 'updated') => {
    return {
      message: type === 'created' ? 'Student created successfully' : 'Student updated successfully',
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
      }
    }
  }
}
