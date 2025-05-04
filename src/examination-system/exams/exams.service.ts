import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { Exam } from './entities/exam.entity';
import { Brackets, DataSource } from 'typeorm';
import { ExamQueryDto } from './dto/exam-query.dto';
import { ExamSubject } from '../exam-subjects/entities/exam-subject.entity';
import { Subject } from 'src/subjects/entities/subject.entity';
import { singleExamSelectCols } from './helpers/exam-select-cols';
import { ClassRoom } from 'src/class-rooms/entities/class-room.entity';
import { EClassType } from 'src/common/types/global.type';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { BaseRepository } from 'src/common/repository/base-repository';
import { FastifyRequest } from 'fastify';
import { REQUEST } from '@nestjs/core';
import { paginatedRawData } from 'src/utils/paginatedData';
import { isStudent } from 'src/utils/utils';
import { ExamType } from '../exam-types/entities/exam-type.entity';
import { UtilitiesService } from 'src/utilities/utilities.service';
import { AcademicYear } from 'src/academic-years/entities/academic-year.entity';
import { ExamResultsService } from '../exam-results/exam-results.service';
import { ExamResult } from '../exam-results/entities/exam-result.entity';

@Injectable({ scope: Scope.REQUEST })
export class ExamsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly utilitiesService: UtilitiesService,
    private readonly examResultsService: ExamResultsService,
  ) { super(dataSource, req); }

  async create(createExamDto: CreateExamDto) {
    const branchId = this.utilitiesService.getBranchId();

    const classRoom = await this.getRepository(ClassRoom).findOne({
      where: { id: createExamDto.classRoomId, branch: { id: branchId } },
      relations: { parent: true },
      select: { id: true, name: true, classType: true, parent: { id: true } },
    });
    if (!classRoom) throw new NotFoundException('Class room not found');

    const examType = await this.getRepository(ExamType).findOne({ where: { id: createExamDto.examTypeId }, select: { id: true, name: true } });
    if (!examType) throw new NotFoundException('Exam type not found');

    const academicYear = await this.getRepository(AcademicYear).findOne({
      where: { isActive: true },
      select: { id: true }
    });
    if (!academicYear) throw new NotFoundException('Current academic year not found');

    // check if exam exists
    const existing = await this.getRepository(Exam).findOne({
      where: {
        examType: { id: examType.id },
        classRoom: { id: classRoom.id },
        academicYear: { id: academicYear.id },
      },
      select: { id: true }
    });
    if (existing) throw new ConflictException(`${examType.name} exam of class ${classRoom.name} already exists for this academic year`);

    // evaluate exam subjects
    const examSubjects: Partial<ExamSubject>[] = await Promise.all(createExamDto.examSubjects.map(async (examSubject) => {
      const subject = await this.getSubject(examSubject.subjectId, classRoom);

      // validate if marks are greater than defined in the subject
      this.validateSubjectMarks(examSubject, subject);

      return ({
        examDate: examSubject.examDate,
        startTime: examSubject.startTime,
        duration: examSubject.duration,
        theoryFM: examSubject.theoryFM,
        theoryPM: examSubject.theoryPM,
        practicalFM: examSubject.practicalFM,
        practicalPM: examSubject.practicalPM,
        venue: examSubject.venue,
        subject
      })
    }));

    const examSubjectsSortedByDate = examSubjects.sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
    const startingFrom = examSubjectsSortedByDate[0].examDate;
    const endsOn = examSubjectsSortedByDate[examSubjectsSortedByDate.length - 1].examDate;

    const newExam = this.getRepository(Exam).create({
      examType,
      classRoom,
      academicYear,
      examSubjects,
      startingFrom,
      endsOn
    });

    await this.getRepository(Exam).save(newExam);

    return { message: 'Exam created' }
  }

  async getSubject(subjectId: string, classRoom: ClassRoom): Promise<Subject> {
    const classRoomId = classRoom.classType === EClassType.SECTION ? classRoom.parent?.id : classRoom.id;
    // classRoom can be section also so, while getting the subject look in parent class

    const subject = await this.getRepository(Subject).findOne({
      where: { id: subjectId, classRoom: { id: classRoomId } },
      select: { id: true, theoryFM: true, theoryPM: true, practicalFM: true, practicalPM: true }
    })
    if (!subject) throw new NotFoundException('Subject not found');

    return subject;
  }

  private validateSubjectMarks(examSubject: CreateExamDto['examSubjects'][0], subject: Subject) {
    if (examSubject.theoryFM > subject.theoryFM) throw new BadRequestException(`Theory full mark of subject ${subject.subjectName} cannot be greater than ${subject.theoryFM}.`);
    if (examSubject.theoryPM > subject.theoryPM) throw new BadRequestException(`Theory pass mark of subject ${subject.subjectName} cannot be greater than ${subject.theoryPM}.`);
    if (examSubject.practicalFM > subject.practicalFM) throw new BadRequestException(`Practical full mark of subject ${subject.subjectName} cannot be greater than ${subject.practicalFM}.`);
    if (examSubject.practicalPM > subject.practicalPM) throw new BadRequestException(`Practical pass mark of subject ${subject.subjectName} cannot be greater than ${subject.practicalFM}.`);
  }

  async findAll(queryDto: ExamQueryDto) {
    const queryBuilder = this.getRepository(Exam).createQueryBuilder('exam');

    const currentUser = this.utilitiesService.getCurrentUser();
    if (isStudent(currentUser)) queryDto.classRoomId = currentUser.classRoomId;

    queryBuilder
      .orderBy("exam.createdAt", queryDto.order)
      .offset(queryDto.skip)
      .limit(queryDto.take)
      .leftJoin('exam.examType', 'examType')
      .leftJoin('exam.classRoom', 'classRoom')
      .leftJoin('classRoom.faculty', 'faculty')
      .where("exam.academicYearId = :academicYearId", { academicYearId: await this.utilitiesService.getAcademicYearId() })
      .andWhere(new Brackets(qb => {
        queryDto.examTypes?.length && qb.andWhere('examType.name IN (:...examTypes)', { examTypes: queryDto.examTypes });
        queryDto.facultyId && qb.andWhere('faculty.id = :facultyId', { facultyId: queryDto.facultyId });
        queryDto.classRoomId && qb.andWhere('classRoom.id = :classRoomId', { classRoomId: queryDto.classRoomId });
      }))
      .select([
        'exam.id as id',
        'exam.createdAt as createdAt',
        'exam.startingFrom as startingFrom',
        'exam.endsOn as endsOn',
        'exam.isReportPublished as isReportPublished',
        'examType.id as examTypeId', // required in frontend in exam columns
        'examType.name as examType',
        'classRoom.id as classRoomId', // required in frontend in exam columns
        'classRoom.name as classRoom',
        'faculty.name as faculty',
      ])

    this.utilitiesService.applyBranchFilter(queryBuilder, 'classRoom.branchId = :branchId');

    return paginatedRawData(queryDto, queryBuilder);
  }

  async findOne(id: string, queryDto?: ExamQueryDto) {
    const examSubjectJoinCondition = queryDto.onlyPast
      ? 'DATE(examSubjects.examDate) < CURRENT_DATE()'
      : queryDto.includeExamSubjects ? '1 = 1' : "1 = 0";

    const queryBuilder = this.getRepository(Exam).createQueryBuilder('exam')
      .where('exam.id = :id', { id })
      .andWhere('exam.academicYearId = :academicYearId', { academicYearId: await this.utilitiesService.getAcademicYearId() })
      .leftJoin('exam.examType', 'examType')
      .leftJoin('exam.classRoom', 'classRoom')
      .leftJoin('classRoom.faculty', 'faculty')
      .leftJoin('exam.examSubjects', 'examSubjects', examSubjectJoinCondition)
      .leftJoin('examSubjects.subject', 'subject')

    applySelectColumns(queryBuilder, singleExamSelectCols, 'exam');
    this.utilitiesService.applyBranchFilter(queryBuilder, 'classRoom.branchId = :branchId');

    const existing = await queryBuilder.getOne();

    if (!existing) throw new NotFoundException('Exam not found');

    return existing;
  }

  async update(id: string, updateExamDto: UpdateExamDto) {
    const existing = await this.getRepository(Exam).findOne({
      where: {
        id,
        classRoom: { branch: { id: this.utilitiesService.getBranchId() } }
      },
      relations: {
        examType: true,
        classRoom: {
          parent: true
        },
        examSubjects: true
      },
      select: {
        id: true,
        examType: { id: true },
        classRoom: {
          id: true,
          classType: true,
          parent: {
            id: true,
          }
        },
        examSubjects: { id: true }
      }
    });
    if (!existing) throw new NotFoundException('Exam not found');

    if (updateExamDto.examTypeId && (updateExamDto.examTypeId !== existing.examType?.id || !existing.examType)) {
      const examType = await this.getRepository(ExamType).findOne({ where: { id: updateExamDto.examTypeId }, select: { id: true } });
      if (!examType) throw new NotFoundException('Exam type not found');

      existing.examType = examType;
    }

    const examSubjects: Partial<ExamSubject>[] = await Promise.all(updateExamDto.examSubjects.map(async (examSubject) => ({
      id: examSubject.id,
      examDate: examSubject.examDate,
      startTime: examSubject.startTime,
      duration: examSubject.duration,
      theoryFM: examSubject.theoryFM,
      theoryPM: examSubject.theoryPM,
      practicalFM: examSubject.practicalFM,
      practicalPM: examSubject.practicalPM,
      venue: examSubject.venue,
      subject: await this.getSubject(examSubject.subjectId, existing.classRoom)
    })))

    // remove discarded subjects
    await this.removeDiscardedSubjects(
      existing.examSubjects.map(examSubject => examSubject.id),
      updateExamDto.examSubjects.map(examSubject => examSubject.id)
    );

    Object.assign(existing, { examSubjects });

    await this.getRepository(Exam).save(existing);

    return { message: 'Exam updated' }
  }

  async publishReport(id: string, publish: boolean) {
    const existing = await this.getRepository(Exam).findOne({
      where: { id },
      relations: {
        classRoom: { children: true },
        academicYear: true,
        examSubjects: { subject: true }
      },
      select: {
        id: true,
        classRoom: { id: true, children: { id: true } },
        academicYear: { id: true },
        examSubjects: {
          id: true,
          theoryFM: true,
          theoryPM: true,
          practicalFM: true,
          practicalPM: true,
          subject: {
            id: true,
            type: true,
          }
        }
      },
    });

    if (!existing) throw new NotFoundException('Exam not found');

    if (publish) {
      await this.examResultsService.generate(existing);
    } else {
      // remove exam results of this exam
      await this.getRepository(Exam).createQueryBuilder()
        .delete()
        .from(ExamResult)
        .where('examId = :examId', { examId: existing.id })
        .execute();
    }

    await this.getRepository(Exam).update({ id: existing.id }, { isReportPublished: publish });

    return { message: publish ? 'Report published' : 'Report unpublished' }
  }

  private async removeDiscardedSubjects(previousExamSubjectIds: string[], currentExamSubjectIds: string[]) {
    const removedSubjectIds = previousExamSubjectIds.filter(previousSubjectId => !currentExamSubjectIds.includes(previousSubjectId));
    removedSubjectIds?.length && await this.getRepository(ExamSubject).delete(removedSubjectIds);
  }

  async remove(id: string) {
    await this.getRepository(Exam).delete({ id });

    return { message: 'Exam deleted' }
  }
}
