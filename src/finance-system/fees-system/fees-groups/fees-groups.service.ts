import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateFeesGroupDto } from './dto/create-fees-group.dto';
import { UpdateFeesGroupDto } from './dto/update-fees-group.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { FeesGroup } from './entities/fees-group.entity';
import { Brackets, ILike, Repository } from 'typeorm';
import { QueryDto } from 'src/core/dto/query.dto';
import paginatedData from 'src/core/utils/paginatedData';
import { ClassRoomsService } from 'src/class-rooms/class-rooms.service';

@Injectable()
export class FeesGroupsService {
  constructor(
    @InjectRepository(FeesGroup) private readonly feesGroupRepo: Repository<FeesGroup>,
    private readonly classRoomsService: ClassRoomsService,
  ) { }

  async create(createFeesGroupDto: CreateFeesGroupDto) {
    await this.checkIfFeesGroupExist(createFeesGroupDto.name);

    // evaluate class room
    const classRoom = createFeesGroupDto.classRoomId ? await this.classRoomsService.findOne(createFeesGroupDto.classRoomId) : null;

    const feesGroup = this.feesGroupRepo.create({
      ...createFeesGroupDto,
      classRoom,
    });
    return await this.feesGroupRepo.save(feesGroup);
  }

  async findAll(queryDto: QueryDto) {
    const queryBuilder = this.feesGroupRepo.createQueryBuilder('feesGroup');

    queryBuilder
      .skip(queryDto.skip)
      .take(queryDto.take)
      .orderBy('feesGroup.createdAt', 'DESC')
      .where(new Brackets(qb => {
        queryDto.search && qb.andWhere({ name: ILike(`%${queryDto.search}%`) })
      }));

    return paginatedData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const existing = await this.feesGroupRepo.findOne({
      where: { id },
      relations: {
        classRoom: true,
      }
    });
    if (!existing) throw new BadRequestException('Fees group not found');

    return existing;
  }

  async update(id: string, updateFeesGroupDto: UpdateFeesGroupDto) {
    const existing = await this.findOne(id);
    existing.name !== updateFeesGroupDto.name && await this.checkIfFeesGroupExist(updateFeesGroupDto.name);

    const classRoom = ((updateFeesGroupDto.classRoomId && existing?.classRoom?.id !== updateFeesGroupDto.classRoomId) || existing?.classRoom?.id)
      ? await this.classRoomsService.findOne(updateFeesGroupDto.classRoomId)
      : null;

    Object.assign(existing, updateFeesGroupDto);
    existing.classRoom = classRoom;

    return await this.feesGroupRepo.save(existing);
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    return await this.feesGroupRepo.remove(existing);
  }

  async checkIfFeesGroupExist(name: string) {
    const existing = await this.feesGroupRepo.findOne({ where: { name } });
    if (existing) throw new BadRequestException('Fees group already exist');
  }
}
