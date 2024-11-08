import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Exam } from './entities/exam.entity';
import { Brackets, Repository } from 'typeorm';
import { ClassRoomsService } from 'src/class-rooms/class-rooms.service';
import { ExamTypesService } from '../exam-types/exam-types.service';
import { ExamQueryDto } from './dto/exam-query.dto';
import { AcademicYear } from 'src/academic-years/entities/academic-year.entity';
import { ExamSubject } from '../exam-subjects/entities/exam-subject.entity';
import { Subject } from 'src/subjects/entities/subject.entity';
import { singleExamSelectCols } from './helpers/exam-select-cols';
import { PageMetaDto } from 'src/common/dto/pageMeta.dto';
import { PageDto } from 'src/common/dto/page.dto.';
import { ClassRoom } from 'src/class-rooms/entities/class-room.entity';
import { EClassType } from 'src/common/types/global.type';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam) private examRepo: Repository<Exam>,
    @InjectRepository(Subject) private subjectRepo: Repository<Subject>,
    @InjectRepository(AcademicYear) private academicYearRepo: Repository<AcademicYear>,
    private readonly examTypesService: ExamTypesService,
    private readonly classRoomsService: ClassRoomsService,
  ) { }

  async create(createExamDto: CreateExamDto) {
    const examType = await this.examTypesService.findOne(createExamDto.examTypeId);
    const classRoom = await this.classRoomsService.findOne(createExamDto.classRoomId);
    const academicYear = await this.academicYearRepo.findOneBy({ isActive: true });

    // evaluate exam subjects
    const examSubjects: Partial<ExamSubject>[] = await Promise.all(createExamDto.examSubjects.map(async (examSubject) => ({
      examDate: examSubject.examDate,
      startTime: examSubject.startTime,
      duration: examSubject.duration,
      fullMark: examSubject.fullMark,
      passMark: examSubject.passMark,
      venue: examSubject.venue,
      subject: await this.getSubject(examSubject.subjectId, classRoom)
    })))

    const newExam = this.examRepo.create({
      examType,
      classRoom,
      academicYear,
      examSubjects,
    });

    await this.examRepo.save(newExam);

    return {
      message: 'Exam created',
    }
  }

  async getSubject(subjectId: string, classRoom: ClassRoom): Promise<Subject> {
    const classRoomId = classRoom.classType === EClassType.SECTION ? classRoom.parent?.id : classRoom.id;
    // classRoom can be section also so, while getting the subject look in parent class

    const subject = await this.subjectRepo.findOne({
      where: { id: subjectId, classRoom: { id: classRoomId } },
      select: { id: true }
    })
    if (!subject) throw new NotFoundException('Subject not found');

    return subject;
  }

  async findAll(queryDto: ExamQueryDto) {
    const queryBuilder = this.examRepo.createQueryBuilder('exam');

    queryBuilder
      .leftJoin('exam.examType', 'examType')
      .leftJoin('exam.classRoom', 'classRoom')
      .leftJoin('classRoom.parent', 'parent')
      .where(
        new Brackets(qb => {
          queryDto.classRoomId && qb.andWhere(
            new Brackets(qb => {
              qb.orWhere('parent.id = :classRoomId', { classRoomId: queryDto.classRoomId });
              qb.orWhere('classRoom.id = :classRoomId', { classRoomId: queryDto.classRoomId });
            })
          );

          queryDto.sectionId &&
            qb.andWhere('classRoom.id = :sectionId', { sectionId: queryDto.sectionId });

          queryDto.examTypes?.length &&
            qb.andWhere('examType.name IN (:...examTypes)', { examTypes: queryDto.examTypes });
        })
      )
      .addSelect([
        'examType.name as examType',
        'classRoom.name as classRoom',
        'parent.name as parentClass',
      ])
      .addSelect(subQuery => {
        return subQuery
          .select("JSON_OBJECT('subjectName', subject.subjectName, 'examDate', es.examDate)")
          .from("ExamSubject", "es")
          .leftJoin("es.subject", "subject")
          .where("es.examId = exam.id")
          .andWhere("es.examDate > CURRENT_DATE()")
          .orderBy("es.examDate", "ASC")
          .limit(1)
      }, "upcomingSubject")
      .orderBy("exam.createdAt", queryDto.order)
      .offset(queryDto.skip)
      .limit(queryDto.take);

    const itemCount = await queryBuilder.getCount();
    const data = await queryBuilder.getRawMany();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto: queryDto });

    return new PageDto(data, pageMetaDto);
  }

  async findOne(id: string) {
    const existing = await this.examRepo.findOne({
      where: {
        id
      },
      relations: {
        examType: true,
        classRoom: {
          parent: true,
        },
        examSubjects: {
          subject: true
        },
      },
      select: singleExamSelectCols,
    })

    if (!existing) throw new Error('Exam not found');

    return existing
  }

  async update(id: string, updateExamDto: UpdateExamDto) {
    return `This action updates a #${id} exam`;
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    return await this.examRepo.remove(existing);
  }
}
