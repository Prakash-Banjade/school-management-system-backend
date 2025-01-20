import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Faculty } from './entities/faculty.entity';
import { Brackets, ILike, Repository } from 'typeorm';
import { FacultiesQueryDto, FacultyOptionsQueryDto } from './dto/faculties-query.dto';
import { paginatedRawData } from 'src/utils/paginatedData';
import { ClassRoom } from 'src/class-rooms/entities/class-room.entity';
import { UtilitiesService } from 'src/utilities/utilities.service';
import { EClassType } from 'src/common/types/global.type';

@Injectable()
export class FacultiesService {
  constructor(
    @InjectRepository(Faculty) private readonly facultiesRepo: Repository<Faculty>,
    @InjectRepository(ClassRoom) private readonly classRoomsRepo: Repository<ClassRoom>,
    private readonly utilitiesService: UtilitiesService,
  ) { }

  async create(createFacultyDto: CreateFacultyDto) {
    const existingWithSameName = await this.facultiesRepo.findOne({ where: { name: ILike(`${createFacultyDto.name}`) }, select: { id: true } });
    if (existingWithSameName) throw new ConflictException('Faculty with same name already exists');

    const newFaculty = this.facultiesRepo.create({
      ...createFacultyDto,
      description: createFacultyDto.description || ''
    });

    await this.facultiesRepo.save(newFaculty);

    return { message: 'Faculty added' }
  }

  findAll(queryDto: FacultiesQueryDto) {
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
    const { role, accountId } = this.utilitiesService.getCurrentUser();

    const includeSection = queryDto.include === 'section';
    const includeClassRoom = includeSection || queryDto.include === 'classRoom';

    if (queryDto.keyValue) return this.getOptionsByKeyValue(queryDto);

    return this.facultiesRepo.createQueryBuilder('faculty')
      .orderBy('faculty.name', 'ASC')
      .leftJoin(
        'faculty.classRooms',
        'classRooms',
        includeClassRoom
          ? !!branchId
            ? "classRooms.branchId = :branchId AND classRooms.classType = :classType"
            : 'classRooms.classType = :classType'
          : '1 = 0',
        { branchId, classType: EClassType.PRIMARY }
      )
      .leftJoin(
        'classRooms.children',
        'children',
        includeSection ? '1 = 1' : '1 = 0'
      )
      .select([
        "faculty.id",
        "faculty.name",
        ...(
          includeClassRoom ? [
            "classRooms.id",
            "classRooms.name"
          ] : []
        ),
        ...(
          includeSection ? [
            "children.id",
            "children.name"
          ] : []
        )
      ]).getMany()
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
      ]).getRawMany();
  }

  async update(id: string, updateFacultyDto: UpdateFacultyDto) {
    const existing = await this.findOne(id)

    if (updateFacultyDto.name && updateFacultyDto.name?.toLowerCase() !== existing.name?.toLocaleLowerCase()) {
      const existingWithSameName = await this.facultiesRepo.findOne({ where: { name: ILike(`${updateFacultyDto.name}`) }, select: { id: true } });
      if (existingWithSameName) throw new ConflictException('Faculty with same name already exists');
    }

    await this.facultiesRepo.update({ id }, updateFacultyDto);

    return { message: 'Faculty updated' }
  }

  async remove(id: string) {
    const existingClassroom = await this.classRoomsRepo.findOne({
      where: { faculty: { id } },
      select: { id: true }
    });

    if (existingClassroom) throw new ForbiddenException("Cannot delete faculty because it has class rooms. Please delete the class rooms first.");

    await this.facultiesRepo.delete({ id });

    return { message: 'Faculty deleted' }
  }
}
