import { BadRequestException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Student } from './entities/student.entity';
import { DataSource } from 'typeorm';
import { StudentQueryDto } from './dto/student-query.dto';
import { ClassRoomsService } from 'src/class-rooms/class-rooms.service';
import { REQUEST } from '@nestjs/core';
import { singleStudentColumnsConfig } from './helpers/studentsColumnsConfig';
import { DormitoryRoomsService } from 'src/dormitory-system/dormitory-rooms/dormitory-rooms.service';
import { EnrollmentsService } from 'src/enrollments/enrollments.service';
import { BaseRepository } from 'src/common/repository/base-repository';
import { ImagesService } from 'src/file-management/images/images.service';
import { AccountsService } from 'src/auth-system/accounts/accounts.service';
import { FastifyRequest } from 'fastify';
import { StudentsHelper } from './helpers/students.helper';
import { EClassType } from 'src/common/types/global.type';
import { StudentAttendanceQueryDto } from './dto/student-attendance-query.dto';
import { FilesService } from 'src/file-management/files/files.service';

@Injectable({ scope: Scope.REQUEST })
export class StudentsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly imageService: ImagesService,
    private readonly filesService: FilesService,
    private readonly classRoomsService: ClassRoomsService,
    private readonly accountsService: AccountsService,
    private dormitoryRoomsService: DormitoryRoomsService,
    private readonly enrollmentsService: EnrollmentsService,
    private readonly studentsHelper: StudentsHelper
  ) {
    super(dataSource, req);
  }

  async create(createStudentDto: CreateStudentDto) {
    await this.studentsHelper.checkIfStudentExists(createStudentDto);

    // evaluate profile image
    const profileImage = createStudentDto.profileImageId
      ? await this.imageService.findOne(createStudentDto.profileImageId)
      : null;

    // evaluate class room
    const classRoom = await this.classRoomsService.findOne(createStudentDto.classRoomId);
    if (classRoom.classType === EClassType.PRIMARY && classRoom.children?.length > 0) { // if there are class sections, then section is needed
      throw new BadRequestException('Please select section');
    }

    // evaluate document attachments
    const documentAttachments = createStudentDto.documentAttachmentIds
      ? await this.filesService.findAllByIds(createStudentDto.documentAttachmentIds)
      : null;

    console.log(documentAttachments)

    // evaluate dormitory room
    const dormitoryRoom = createStudentDto.dormitoryRoomId
      ? await this.dormitoryRoomsService.findOne(createStudentDto.dormitoryRoomId)
      : null;

    const newStudent = this.getRepository<Student>(Student).create({
      ...createStudentDto,
      profileImage,
      classRoom,
      documentAttachments,
      dormitoryRoom
    });

    const savedStudent = await this.getRepository<Student>(Student).save(newStudent);

    // CREATE ACCOUNT
    await this.accountsService.createAccount(savedStudent);

    // CREATE ENROLLMENTS
    await this.enrollmentsService.create({
      studentId: savedStudent.id,
      classRoomId: classRoom.id,
      enrollmentDate: createStudentDto.admissionDate,
    }, true);

    return this.studentMutationReturn(savedStudent, 'created');
  }

  async findAll(queryDto: StudentQueryDto) {
    return this.studentsHelper.setQuery(queryDto);
  }

  async findOne(id: string) {
    const existing = await this.getRepository<Student>(Student).findOne({
      where: { id },
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

    return existing
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
    const student = await this.getRepository<Student>(Student).createQueryBuilder('student')
      .leftJoin("student.profileImage", "profileImage")
      .leftJoin("student.enrollments", "enrollment")
      .leftJoin("student.bookTransactions", "bookTransactions")
      .leftJoin("enrollment.academicYear", "academicYear")
      .leftJoin("student.classRoom", "classRoom")
      .leftJoin("classRoom.parent", "parent")
      .where("student.studentId = :studentId", { studentId })
      .andWhere("academicYear.isActive = :isActive", { isActive: true })
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
    const existing = await this.findOne(id)

    // check if credentials are already taken
    await this.studentsHelper.checkIfStudentExists(updateStudentDto, existing);

    // evaluate profile image
    const profileImage = updateStudentDto.profileImageId
      ? await this.imageService.findOne(updateStudentDto.profileImageId)
      : existing.profileImage;

    /**
    |--------------------------------------------------
    | don't allow to udpate class room
    |--------------------------------------------------
    */

    // evaluate document attachments
    const documentAttachments = updateStudentDto.documentAttachmentIds
      ? await this.filesService.findAllByIds(updateStudentDto.documentAttachmentIds)
      : existing.documentAttachments;

      console.log(documentAttachments)

    // evaluate dormitory room
    const dormitoryRoom = updateStudentDto.dormitoryRoomId
      ? await this.dormitoryRoomsService.findOne(updateStudentDto.dormitoryRoomId)
      : updateStudentDto.dormitoryRoomId === null // unsetting dormitory room
        ? null
        : existing.dormitoryRoom;

    Object.assign(existing, {
      ...updateStudentDto,
      profileImage,
      documentAttachments,
      dormitoryRoom,
    });

    const savedStudent = await this.getRepository<Student>(Student).save(existing);

    return this.studentMutationReturn(savedStudent, 'updated');
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
