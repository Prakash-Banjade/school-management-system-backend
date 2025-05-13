import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Faculty } from './entities/faculty.entity';
import { Brackets, ILike, Repository } from 'typeorm';
import { FacultyOptionsQueryDto } from './dto/faculties-query.dto';
import { paginatedRawData } from 'src/utils/paginatedData';
import { ClassRoom } from 'src/class-rooms/entities/class-room.entity';
import { UtilitiesService } from 'src/utilities/utilities.service';
import { EClassType, Role } from 'src/common/types/global.type';
import { QueryDto } from 'src/common/dto/query.dto';
import { SCHOOL_LEVEL_FACULTY_NAME } from 'src/common/CONSTANTS';

@Injectable()
export class FacultiesService {
  constructor(
    @InjectRepository(Faculty) private readonly facultiesRepo: Repository<Faculty>,
    @InjectRepository(ClassRoom) private readonly classRoomsRepo: Repository<ClassRoom>,
    private readonly utilitiesService: UtilitiesService,
  ) { }

  async create(createFacultyDto: CreateFacultyDto) {
    const existingWithSameName = await this.facultiesRepo.findOne({ where: { name: ILike(createFacultyDto.name) }, select: { id: true } });
    if (existingWithSameName) throw new ConflictException('Faculty with same name already exists');

    const newFaculty = this.facultiesRepo.create({
      ...createFacultyDto,
      description: createFacultyDto.description || ''
    });

    await this.facultiesRepo.save(newFaculty);

    return { message: 'Faculty added' }
  }

  findAll(queryDto: QueryDto) {
    const queryBuilder = this.facultiesRepo.createQueryBuilder('faculty');

    queryBuilder
      .limit(queryDto.take)
      .offset(queryDto.skip)
      .orderBy('faculty.createdAt', queryDto.order)
      .where(new Brackets(qb => {
        queryDto.search && qb.andWhere("LOWER(faculty.name) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
      }))
      .select([
        'faculty.id as id',
        'faculty.name as name',
        'faculty.description as description'
      ]);

    return paginatedRawData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const existing = await this.facultiesRepo.findOne({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true
      }
    });

    if (!existing) throw new NotFoundException('Faculty not found');

    return existing;
  }

  async getOptions(queryDto: FacultyOptionsQueryDto) {
    const branchId = this.utilitiesService.getBranchId();
    const currentUser = this.utilitiesService.getCurrentUser();

    const includeSection = queryDto.include === 'section';
    const includeClassRoom = includeSection || queryDto.include === 'classRoom' || currentUser.role === Role.TEACHER;

    if (queryDto.keyValue) return this.getOptionsByKeyValue(queryDto);

    const querybuilder = this.facultiesRepo.createQueryBuilder('faculty')
      .orderBy('faculty.name', 'ASC')
      .select(["faculty.id", "faculty.name"]);

    if (includeClassRoom) {
      querybuilder.leftJoin(
        'faculty.classRooms',
        'classRooms',
        !!branchId
          ? "classRooms.branchId = :branchId AND classRooms.classType = :classType"
          : 'classRooms.classType = :classType',
        { branchId, classType: EClassType.PRIMARY }
      ).addSelect([
        "classRooms.id",
        "classRooms.name"
      ])
    }

    if (includeSection) {
      querybuilder
        .leftJoin('classRooms.children', 'children')
        .addSelect([
          "children.id",
          "children.name"
        ])
    }

    return querybuilder.cache(true).getMany();
  }


  async getOptionsByKeyValue(queryDto: FacultyOptionsQueryDto) {
    return this.facultiesRepo.createQueryBuilder('faculty')
      .orderBy('faculty.name', 'ASC')
      .offset(queryDto.skip)
      .limit(queryDto.take)
      .where(new Brackets(qb => {
        queryDto.search && qb.andWhere("LOWER(faculty.name) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
      }))
      .select([
        "faculty.name as label",
        "faculty.id as value"
      ])
      .cache(true)
      .getRawMany();
  }

  async update(id: string, updateFacultyDto: UpdateFacultyDto) {
    const existing = await this.findOne(id)

    if (existing.name === SCHOOL_LEVEL_FACULTY_NAME) throw new ForbiddenException("Cannot update school level faculty.");

    if (updateFacultyDto.name && updateFacultyDto.name?.toLowerCase() !== existing.name?.toLocaleLowerCase()) {
      const existingWithSameName = await this.facultiesRepo.findOne({ where: { name: ILike(updateFacultyDto.name) }, select: { id: true } });
      if (existingWithSameName) throw new ConflictException('Faculty with same name already exists');
    }

    await this.facultiesRepo.update({ id }, updateFacultyDto);

    return { message: 'Faculty updated' }
  }

  async remove(id: string) {
    const existingClassroom = await this.classRoomsRepo.findOne({
      where: { faculty: { id } },
      relations: { faculty: true },
      select: { id: true, name: true, faculty: { id: true, name: true } }
    });

    if (existingClassroom) throw new ForbiddenException("Cannot delete faculty because it has class rooms. Please delete the class rooms first.");

    if (existingClassroom.faculty?.name === SCHOOL_LEVEL_FACULTY_NAME) throw new ForbiddenException("Cannot delete school level faculty.");

    await this.facultiesRepo.delete({ id });

    return { message: 'Faculty deleted' }
  }
}
