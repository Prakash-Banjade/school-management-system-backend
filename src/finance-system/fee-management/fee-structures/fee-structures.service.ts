import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { UpdateFeeStructureDto } from './dto/update-fee-structure.dto';
import { BaseRepository } from 'src/common/repository/base-repository';
import { Brackets, DataSource, In } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { ClassRoom } from 'src/class-rooms/entities/class-room.entity';
import { ChargeHead } from '../charge-heads/entities/charge-head.entity';
import { FeeStructure } from './entities/fee-structure.entity';
import { FeeStructureQueryDto } from './dto/fee-structure-query.dto';
import paginatedData from 'src/utils/paginatedData';
import { MANDATORY_CHARGE_HEADS } from 'src/common/CONSTANTS';

@Injectable()
export class FeeStructuresService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest
  ) { super(dataSource, req); }

  async create(createFeeStructureDto: CreateFeeStructureDto) {
    const chargeHead = await this.getRepository(ChargeHead).findOneBy({ id: createFeeStructureDto.chargeHeadId });
    if (!chargeHead) throw new NotFoundException('Charge head not found');

    const classRoom = await this.getRepository(ClassRoom).findOne({
      where: { id: createFeeStructureDto.classRoomId },
      relations: { feeStructures: { chargeHead: true } },
      select: { id: true, feeStructures: { id: true, chargeHead: { id: true } } },
    });
    if (!classRoom) throw new NotFoundException('Class room not found');
    if (classRoom.feeStructures?.find(feeStructure => feeStructure.chargeHead?.id === chargeHead.id)) throw new ConflictException('Charge head already exists in class room');

    const existingWithSameChargeHead = classRoom.feeStructures?.find(feeStructure => feeStructure.chargeHead?.id === chargeHead.id);
    if (existingWithSameChargeHead) throw new ConflictException('Charge head already exists in class room');

    const newFeeStructure = this.getRepository(FeeStructure).create({
      ...createFeeStructureDto,
      chargeHead,
      classRoom,
    });

    await this.getRepository(FeeStructure).save(newFeeStructure);

    return { message: 'Fee structure created' };
  }

  async createMandatoryFeeStructures(amounts: { admissionFee: number, monthlyFee: number }) {
    const mandatoryChargeHeads = await this.getRepository(ChargeHead).find({
      where: { name: In(Object.values(MANDATORY_CHARGE_HEADS)) },
    });
    if (mandatoryChargeHeads.length !== Object.values(MANDATORY_CHARGE_HEADS).length) throw new BadRequestException('Mandatory charge heads not spedified yet');

    return mandatoryChargeHeads.map(chargeHead => {
      const key = Object.entries(MANDATORY_CHARGE_HEADS).find(([_, value]) => value === chargeHead.name)?.[0];
      if (!key) throw new BadRequestException('Mandatory charge head not found');

      return this.getRepository(FeeStructure).create({
        chargeHead: chargeHead,
        amount: amounts[key],
      })
    });
  }

  findAll(queryDto: FeeStructureQueryDto) {
    const querybuilder = this.getRepository(FeeStructure).createQueryBuilder('feeStructure');

    querybuilder
      .orderBy(queryDto.sortBy, queryDto.order)
      .skip(queryDto.skipPagination ? undefined : queryDto.skip)
      .take(queryDto.skipPagination ? undefined : queryDto.take)
      .leftJoin('feeStructure.chargeHead', 'chargeHead')
      .where(new Brackets(qb => {
        queryDto.classRoomId && qb.andWhere('feeStructure.classRoomId = :classRoomId', { classRoomId: queryDto.classRoomId })
      }))
      .select([
        'feeStructure.id',
        'feeStructure.createdAt',
        'feeStructure.amount',
        'chargeHead.name',
        'chargeHead.id',
        'chargeHead.isMandatory'
      ])

    return paginatedData(queryDto, querybuilder);
  }

  async findOne(id: string) {
    const existing = await this.getRepository(FeeStructure).findOne({
      where: { id },
      relations: { chargeHead: true, classRoom: true },
    });
    if (!existing) throw new NotFoundException('Fee structure not found');

    return existing;
  }

  async update(id: string, updateFeeStructureDto: UpdateFeeStructureDto) {
    const existing = await this.findOne(id);

    Object.assign(existing, updateFeeStructureDto);

    await this.getRepository(FeeStructure).save(existing);
    return { message: 'Fee structure updated' };
  }

  async remove(id: string) {
    const existing = await this.findOne(id);

    if (existing.chargeHead.isMandatory) throw new BadRequestException('Cannot delete mandatory fee structure');

    this.getRepository(FeeStructure).remove(existing);

    return { message: 'Fee structure removed' };
  }
}
