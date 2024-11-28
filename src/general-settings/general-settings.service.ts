import { Inject, Injectable } from '@nestjs/common';
import { GeneralSettingDto } from './dto/general-setting.dto';
import { BaseRepository } from 'src/common/repository/base-repository';
import { DataSource, IsNull, Not } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { GeneralSettingQueryDto } from './dto/general-setting-query.dto';
import { GeneralSetting } from './entities/general-setting.entity';

@Injectable()
export class GeneralSettingsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) private req: FastifyRequest,
  ) { super(dataSource, req) }

  async set(dto: GeneralSettingDto) {
    const existing = await this.getRepository(GeneralSetting).findOne({ where: { id: Not(IsNull()) } });

    if (existing) {
      Object.assign(existing, dto);
      await this.getRepository(GeneralSetting).save(existing);
      return {
        message: 'Settings updated',
      }
    }

    const newSetting = this.getRepository(GeneralSetting).create(dto);
    await this.getRepository(GeneralSetting).save(newSetting);

    return {
      message: 'Settings updated',
    }
  }

  async get(queryDto: GeneralSettingQueryDto) {
    const setting = await this.getRepository(GeneralSetting).findOne({
      where: { id: Not(IsNull()) },
      select: queryDto.settings?.includes('all') 
        ? undefined
        : {
          id: true,
          updatedAt: true,
          libraryFine: queryDto.settings?.includes('libraryFine'),
        }
    });

    // if no setting create new one
    if (!setting) {
      const newSetting = this.getRepository(GeneralSetting).create({});
      return this.getRepository(GeneralSetting).save(newSetting);
    }

    return setting;
  }
}
