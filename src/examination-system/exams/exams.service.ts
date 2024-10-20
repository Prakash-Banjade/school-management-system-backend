import { Injectable } from '@nestjs/common';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Exam } from './entities/exam.entity';
import { Brackets, Repository } from 'typeorm';
import { ClassRoomsService } from 'src/class-rooms/class-rooms.service';
import { ExamTypesService } from '../exam-types/exam-types.service';
import { ExamQueryDto } from './dto/exam-query.dto';
import { AcademicYear } from 'src/academic-years/entities/academic-year.entity';
import paginatedData from 'src/utils/paginatedData';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam) private examRepo: Repository<Exam>,
    @InjectRepository(AcademicYear) private academicYearRepo: Repository<AcademicYear>,
    private readonly examTypesService: ExamTypesService,
    private readonly classRoomsService: ClassRoomsService,
  ) { }

  async create(createExamDto: CreateExamDto) {
    const examType = await this.examTypesService.findOne(createExamDto.examTypeId);
    const classRoom = await this.classRoomsService.findOne(createExamDto.classRoomId);
    const academicYear = await this.academicYearRepo.findOneBy({ isActive: true });

    const newExam = this.examRepo.create({
      examType,
      classRoom,
      academicYear,
    });

    const savedExam = await this.examRepo.save(newExam);

    return {
      message: 'Exam created successfully',
      exam: {
        id: savedExam.id,
        type: savedExam.examType.name,
        classRoom: savedExam.classRoom.name,
      }
    }
  }

  async findAll(queryDto: ExamQueryDto) {
    const querybuilder = this.examRepo.createQueryBuilder('exam');

    querybuilder
      .orderBy("exam.createdAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .leftJoinAndSelect('exam.examType', 'examType')
      .leftJoinAndSelect('exam.classRoom', 'classRoom')
      .where(new Brackets(qb => {
        // queryDto.search && qb.andWhere("LOWER(exam.type) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
      }))

    return paginatedData(queryDto, querybuilder);
  }

  async findOne(id: string) {
    const existing = await this.examRepo.findOne({
      where: {
        id
      },
      relations: {
        examType: true,
        classRoom: true,
        examSubjects: true,
      }
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
