import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateClassRoutineDto } from './dto/create-class-routine.dto';
import { UpdateClassRoutineDto } from './dto/update-class-routine.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ClassRoutine } from './entities/class-routine.entity';
import { Brackets, Repository } from 'typeorm';
import { ClassRoomsService } from 'src/class-rooms/class-rooms.service';
import { SubjectsService } from 'src/subjects/subjects.service';
import { ClassRoutineQueryDto } from './dto/class-routine.query.dto';
import paginatedData from 'src/utils/paginatedData';

@Injectable()
export class ClassRoutinesService {
  constructor(
    @InjectRepository(ClassRoutine) private classRoutineRepo: Repository<ClassRoutine>,
    private readonly classRoomsService: ClassRoomsService,
    private readonly subjectsService: SubjectsService,
  ) { }

  async create(createClassRoutineDto: CreateClassRoutineDto) {
    const classRoom = await this.classRoomsService.findOne(createClassRoutineDto.classRoomId);
    const subject = await this.subjectsService.findOne(createClassRoutineDto.subjectId);

    // validate if class room have the subject
    if (subject.classRoom?.id !== classRoom.id) throw new BadRequestException('Class room does not have the subject');

    const newClassRoutine = this.classRoutineRepo.create({
      ...createClassRoutineDto,
      classRoom,
      subject
    });

    return this.classRoutineRepo.save(newClassRoutine);
  }

  async findAll(queryDto: ClassRoutineQueryDto) {
    const querybuilder = this.classRoutineRepo.createQueryBuilder('classRoutine');

    querybuilder
      .orderBy("classRoutine.createdAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .leftJoinAndSelect('classRoutine.classRoom', 'classRoom')
      .leftJoinAndSelect('classRoutine.subject', 'subject')
      .where(new Brackets(qb => {
        queryDto.classRoomId && qb.andWhere('classRoom.id = :classRoomId', { classRoomId: queryDto.classRoomId });
        queryDto.subjectId && qb.andWhere('subject.id = :subjectId', { subjectId: queryDto.subjectId });
        queryDto.dayOfTheWeek && qb.andWhere('classRoutine.dayOfTheWeek = :dayOfTheWeek', { dayOfTheWeek: queryDto.dayOfTheWeek });
      }))

    return paginatedData(queryDto, querybuilder);
  }

  async findOne(id: string) {
    const existing = await this.classRoutineRepo.findOne({
      where: { id },
      relations: ['classRoom', 'subject'],
    })

    if (!existing) throw new Error('ClassRoutine not found');
    return existing
  }

  async update(id: string, updateClassRoutineDto: UpdateClassRoutineDto) {
    const existing = await this.classRoutineRepo.findOneBy({ id });

    const classRoom = updateClassRoutineDto.classRoomId
      ? await this.classRoomsService.findOne(updateClassRoutineDto.classRoomId)
      : existing.classRoom;

    const subject = updateClassRoutineDto.subjectId
      ? await this.subjectsService.findOne(updateClassRoutineDto.subjectId)
      : existing.subject;

    Object.assign(existing, {
      ...updateClassRoutineDto,
      classRoom,
      subject
    });

    return this.classRoutineRepo.save(existing);
  }

  async remove(id: string) {
    const existing = await this.classRoutineRepo.findOneBy({ id });

    return await this.classRoutineRepo.remove(existing);
  }
}
