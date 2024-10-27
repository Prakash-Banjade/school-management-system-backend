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
import { AuthUser, EClassType, Role } from 'src/common/types/global.type';
import { isStudent } from 'src/utils/isStudent';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import { classRoutinesSelectCols } from './helpers/class-routines-select-cols.config';
import { Subject } from 'src/subjects/entities/subject.entity';
import { ClassRoom } from 'src/class-rooms/entities/class-room.entity';

@Injectable()
export class ClassRoutinesService {
  constructor(
    @InjectRepository(ClassRoutine) private classRoutineRepo: Repository<ClassRoutine>,
    private readonly classRoomsService: ClassRoomsService,
    private readonly subjectsService: SubjectsService,
  ) { }

  async create(createClassRoutineDto: CreateClassRoutineDto) {
    const classRoom = await this.classRoomsService.findOne(createClassRoutineDto.classRoomId);
    const subject = createClassRoutineDto.subjectId
      ? await this.subjectsService.findOne(createClassRoutineDto.subjectId)
      : null;

    // validate if class room have the subject
    subject && this.validateIfClassRoomHaveSubject(subject, classRoom);

    const newClassRoutine = this.classRoutineRepo.create({
      ...createClassRoutineDto,
      classRoom,
      subject
    });

    const savedClassRoutine = await this.classRoutineRepo.save(newClassRoutine);

    return this.classRoutineMutationReturn(savedClassRoutine, 'created');
  }

  private validateIfClassRoomHaveSubject(subject: Subject | null, classRoom: ClassRoom) {
    const parentClass = classRoom?.classType === EClassType.SECTION ? classRoom.parent : classRoom;
    if (parentClass?.id !== subject.classRoom?.id) throw new BadRequestException('Class room does not have the subject');
  }

  async findAll(queryDto: ClassRoutineQueryDto, currentUser: AuthUser) {
    const querybuilder = this.classRoutineRepo.createQueryBuilder('classRoutine');

    querybuilder
      .orderBy("classRoutine.createdAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .leftJoin('classRoutine.classRoom', 'classRoom')
      .leftJoin('classRoom.parent', 'parent')
      .leftJoin('classRoutine.subject', 'subject')
      .leftJoin('subject.teacher', 'teacher')
      .where(new Brackets(qb => {
        queryDto.dayOfTheWeek && qb.andWhere('classRoutine.dayOfTheWeek = :dayOfTheWeek', { dayOfTheWeek: queryDto.dayOfTheWeek });

        if (currentUser.role === Role.ADMIN && queryDto.classRoomId) { // routine can be associated with parent ot itself is a parent
          qb.andWhere(new Brackets(qb => {
            qb.orWhere('parent.id = :classRoomId', { classRoomId: queryDto.classRoomId });
            qb.orWhere('classRoom.id = :classRoomId', { classRoomId: queryDto.classRoomId });
          }))
        }

        if (currentUser.role === Role.ADMIN) { // admin access
          queryDto.sectionId && qb.andWhere('classRoom.id = :sectionId', { sectionId: queryDto.sectionId }); // the sectionId send by the frontend is the class room id
          queryDto.subjectId && qb.andWhere('subject.id = :subjectId', { subjectId: queryDto.subjectId });
        } else if (isStudent(currentUser)) {
          qb.andWhere('classRoom.id = :classRoomId', { classRoomId: currentUser.classRoomId });
        }

      }))

    applySelectColumns(querybuilder, classRoutinesSelectCols, 'classRoutine');

    // TODO: send routines in ascending order of time
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

    // classroom and subject are note update

    Object.assign(existing, {
      ...updateClassRoutineDto,
    });

    const savedClassRoutine = await this.classRoutineRepo.save(existing);

    return this.classRoutineMutationReturn(savedClassRoutine, 'updated');
  }

  async remove(id: string) {
    const existing = await this.classRoutineRepo.findOneBy({ id });

    await this.classRoutineRepo.remove(existing);

    return this.classRoutineMutationReturn(existing, 'deleted');
  }

  private classRoutineMutationReturn = (classRoutine: ClassRoutine, type: 'created' | 'updated' | 'deleted') => {
    return {
      message: type === 'created' ? 'Class routine created successfully' : type === 'deleted' ? 'Class routine deleted successfully' : 'Class routine updated successfully',
      classRoutine: {
        id: classRoutine.id,
      }
    }
  }
}
