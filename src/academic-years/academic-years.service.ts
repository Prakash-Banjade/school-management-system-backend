import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AcademicYear } from './entities/academic-year.entity';
import { Brackets, Repository } from 'typeorm';
import { QueryDto } from 'src/common/dto/query.dto';
import { PageMetaDto } from 'src/common/dto/pageMeta.dto';
import { PageDto } from 'src/common/dto/page.dto.';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CACHE_KEYS } from 'src/common/CONSTANTS';
import { Cache } from 'cache-manager';
import { AcademicYearOptionsDto } from './dto/academic-year-options.dto';

@Injectable()
export class AcademicYearsService {
  constructor(
    @InjectRepository(AcademicYear) private academicYearRepo: Repository<AcademicYear>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  async create(createAcademicYearDto: CreateAcademicYearDto) {
    const { isPast, latestAcademicYear } = await this.isPast();
    if (isPast) throw new ForbiddenException('Cannot create academic year from past academic year');

    if (new Date(createAcademicYearDto.startDate) <= new Date(latestAcademicYear.endDate)) throw new BadRequestException('Start date must be greater than the end date of this academic year');

    // make all the previous years inactive
    await this.academicYearRepo.update({ isActive: true }, { isActive: false });

    const newAcademicYear = this.academicYearRepo.create({
      ...createAcademicYearDto,
      isActive: true
    });

    const saved = await this.academicYearRepo.save(newAcademicYear);

    await this.cacheManager.set(CACHE_KEYS.CAY_ID, saved.id, 0); // update cache

    return {
      message: "Academic year created successfully",
      academicYear: {
        id: saved.id,
        name: saved.name,
      }
    }
  }

  async findAll(queryDto: QueryDto) {
    // the default setup is altered because the first one should be the active one
    const activeYear = await this.academicYearRepo.findOneBy({ isActive: true });

    const queryBuilder = this.academicYearRepo.createQueryBuilder('academicYear');

    queryBuilder
      .orderBy("academicYear.createdAt", queryDto.order)
      .take(queryDto.take - 1)
      .skip(queryDto.skip)
      .where(new Brackets(qb => {
        qb.where({ isActive: false }) // select all non-active years
      }))

    const itemCount = await queryBuilder.getCount() + 1;
    const { entities } = await queryBuilder.getRawAndEntities();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto: queryDto });

    return new PageDto(!!activeYear ? [activeYear, ...entities] : entities, pageMetaDto);
  }

  async getOptions(queryDto: AcademicYearOptionsDto) {
    const queryBuilder = this.academicYearRepo.createQueryBuilder('academicYear');
    const active = queryDto.onlyPast ? await this.getActive() : undefined;

    queryBuilder
      .orderBy("academicYear.createdAt", queryDto.order)
      .limit(queryDto.take)
      .offset(queryDto.skip)
      .where(new Brackets(qb => {
        !!queryDto.search && qb.where("LOWER(academicYear.name) LIKE LOWER(:search)", { search: `%${queryDto.search}%` });

        !queryDto.withActive && qb.andWhere('academicYear.isActive = :isActive', { isActive: false });

        queryDto.onlyPast && qb.andWhere('DATE(academicYear.startDate) < DATE(:activeYearStartDate)', { activeYearStartDate: active.startDate });
      }))
      .select([
        "academicYear.id as value",
        "academicYear.name as label"
      ])
      .getRawMany();

    return queryBuilder.getRawMany();
  }

  async findOne(id: string) {
    const existing = await this.academicYearRepo.findOneBy({ id });
    if (!existing) throw new BadRequestException('Academic year not found');

    return existing;
  }

  async getActive() {
    const existing = await this.academicYearRepo.findOne({
      where: { isActive: true },
      select: ['id', 'name', 'startDate']
    });
    if (!existing) throw new BadRequestException('Academic year not found');
    return existing;
  }

  async udpateActive(id: string) {
    const existing = await this.findOne(id);

    // make all the previous years inactive
    await this.academicYearRepo.update({ isActive: true }, { isActive: false });

    existing.isActive = true;
    const saved = await this.academicYearRepo.save(existing);

    await this.cacheManager.set(CACHE_KEYS.CAY_ID, saved.id, 0); // update cache

    return {
      message: "Academic year changed",
      academicYear: {
        id: saved.id,
        name: saved.name,
      }
    }
  }

  async update(id: string, updateAcademicYearDto: UpdateAcademicYearDto) {
    const existing = await this.findOne(id);

    // update the academic year
    Object.assign(existing, updateAcademicYearDto);
    const saved = await this.academicYearRepo.save(existing);

    return {
      message: "Updated successfully",
      academicYear: {
        id: saved.id,
        name: saved.name,
      }
    }

  }

  async latest() {
    const latestAcademicYear = await this.academicYearRepo.createQueryBuilder('academicYear') // this is one which is last added
      .orderBy('academicYear.startDate', 'DESC')
      .limit(1)
      .getOne();

    if (!latestAcademicYear) throw new NotFoundException('Latest academic year not found');

    return latestAcademicYear;
  }

  async isPast() {
    const currentAcademicYearId = await this.cacheManager.get(CACHE_KEYS.CAY_ID); // this is one that is currently active
    if (!currentAcademicYearId) throw new NotFoundException('Current academic year not found');

    const latestAcademicYear = await this.academicYearRepo.createQueryBuilder('academicYear') // this is one which is last added
      .orderBy('academicYear.startDate', 'DESC')
      .limit(1)
      .getOne();

    if (!latestAcademicYear) throw new NotFoundException('Latest academic year not found');

    return {
      isPast: currentAcademicYearId !== latestAcademicYear.id,
      latestAcademicYear,
    };
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    await this.academicYearRepo.remove(existing);

    return { message: "Removed successfully" }
  }
}
