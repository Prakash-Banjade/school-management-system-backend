import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreateChargeHeadDto } from './dto/create-charge-head.dto';
import { UpdateChargeHeadDto } from './dto/update-charge-head.dto';
import { BaseRepository } from 'src/common/repository/base-repository';
import { Brackets, DataSource } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { ChargeHead } from './entities/charge-head.entity';
import { QueryDto } from 'src/common/dto/query.dto';
import paginatedData from 'src/utils/paginatedData';
import { isBoolean } from 'class-validator';
import { ChargeHeadOptionsQueryDto } from './dto/charge-head-query.dto';
import { MANDATORY_CHARGE_HEADS } from 'src/common/CONSTANTS';
import { ClassRoom } from 'src/class-rooms/entities/class-room.entity';
import { EClassType } from 'src/common/types/global.type';
import { FeeStructure } from '../fee-structures/entities/fee-structure.entity';

@Injectable({ scope: Scope.REQUEST })
export class ChargeHeadsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest
  ) { super(dataSource, req) }

  async create(dto: CreateChargeHeadDto) {
    const extingWithSameName = await this.getRepository(ChargeHead).findOneBy({ name: dto.name });
    if (extingWithSameName) throw new ConflictException('Charge head with same name already exists');

    const savedChargeHead = await this.getRepository(ChargeHead).save(dto);

    if (dto.isMandatory) await this.createMandatoryFeeStructureForClassRooms(savedChargeHead);

    return { message: 'Charge head created successfully' };
  }

  async createMandatoryFeeStructureForClassRooms(chargeHead: ChargeHead) {
    const classRooms = await this.getRepository(ClassRoom).find({
      where: { classType: EClassType.PRIMARY },
      select: ['id'],
    });

    const feeStructures = classRooms.map(classRoom => this.getRepository(FeeStructure).create({ amount: 0, chargeHead, classRoom }));

    await this.getRepository(FeeStructure).save(feeStructures);
  }

  findAll(queryDto: QueryDto) {
    const querybuilder = this.getRepository(ChargeHead).createQueryBuilder('chargeHead');

    querybuilder
      .orderBy('chargeHead.createdAt', queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .where(new Brackets(qb => {
        queryDto.search && qb.andWhere("LOWER(chargeHead.name) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
      }))
      .select(['chargeHead.id', 'chargeHead.createdAt', 'chargeHead.name', 'chargeHead.description', 'chargeHead.isMandatory'])

    return paginatedData(queryDto, querybuilder);
  }

  getOptions(queryDto: ChargeHeadOptionsQueryDto) {
    const querybuilder = this.getRepository(ChargeHead).createQueryBuilder('chargeHead');

    querybuilder
      .orderBy('chargeHead.createdAt', queryDto.order)
      .offset(queryDto.skip)
      .limit(queryDto.take)
      .where(new Brackets(qb => {
        queryDto.search && qb.andWhere("LOWER(chargeHead.name) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
      }))
      .select([
        'chargeHead.id as value',
        'chargeHead.name as label',
      ]);

    return querybuilder.getRawMany();
  }

  async findOne(id: string) {
    const existing = await this.getRepository(ChargeHead).findOne({
      where: { id }
    });

    if (!existing) throw new NotFoundException('Charge head not found');

    return existing;
  }

  async update(id: string, dto: UpdateChargeHeadDto) {
    const existing = await this.findOne(id);

    // check if name is taken
    if (dto.name && dto.name !== existing.name) {
      const extingWithSameName = await this.getRepository(ChargeHead).findOneBy({ name: dto.name });
      if (extingWithSameName) throw new ConflictException('Charge head with same name already exists');
    }

    Object.assign(existing, {
      ...dto,
      isMandatory: existing.isMandatory ? existing.isMandatory : isBoolean(dto.isMandatory) ? dto.isMandatory : existing.isMandatory,
    });

    await this.getRepository(ChargeHead).save(existing);

    return { message: 'Charge head updated successfully' };
  }

  async remove(id: string) {
    const existing = await this.findOne(id);

    if (existing.isMandatory) throw new BadRequestException('Cannot delete mandatory charge head');

    await this.getRepository(ChargeHead).remove(existing);

    return { message: 'Charge head removed' }
  }

  async addMandatoryHeads() {
    const mandatoryHeads = [
      {
        name: MANDATORY_CHARGE_HEADS.admissionFee,
        description: 'Admission fee for the class room',
      },
      {
        name: MANDATORY_CHARGE_HEADS.monthlyFee,
        description: 'Monthly fee for the class room',
      },
      {
        name: MANDATORY_CHARGE_HEADS.transportationFee,
        description: 'Transportation fee of the student',
      },
      {
        name: MANDATORY_CHARGE_HEADS.libraryFine,
        description: 'Library fine of the student',
      }
    ]

    for (const head of mandatoryHeads) {
      await this.getRepository(ChargeHead)
        .createQueryBuilder()
        .insert()
        .values({
          ...head,
          isMandatory: true
        })
        .orIgnore() // This will skip the record if the unique constraint fails
        .execute();
    }
  }
}
