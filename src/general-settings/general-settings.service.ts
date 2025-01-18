import { Inject, Injectable } from '@nestjs/common';
import { GeneralSettingDto } from './dto/general-setting.dto';
import { BaseRepository } from 'src/common/repository/base-repository';
import { DataSource, IsNull, Not } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { GeneralSettingQueryDto } from './dto/general-setting-query.dto';
import { GeneralSetting } from './entities/general-setting.entity';
import { CacheManagerStore } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CACHE_KEYS } from 'src/common/cache-keys';

@Injectable()
export class GeneralSettingsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) private req: FastifyRequest,
    @Inject(CACHE_MANAGER) private cacheManager: CacheManagerStore,
  ) { super(dataSource, req) }

  async set(dto: GeneralSettingDto) {
    await this.removeCache(); // remove all cache

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

  async get(queryDto: GeneralSettingQueryDto): Promise<GeneralSetting> {
    const cacheKey = `${CACHE_KEYS.GEN_SET}:${queryDto.settings?.join('_') ?? ''}`;

    // if data is cached, return it
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) return cachedData as GeneralSetting;

    // query db for the data
    let setting = await this.getRepository(GeneralSetting).findOne({
      where: { id: Not(IsNull()) },
      select: queryDto.settings?.includes('all')
        ? undefined
        : {
          id: true,
          updatedAt: true,
          libraryFine: queryDto.settings?.includes('libraryFine'),
          currency: queryDto.settings?.includes('currency'),
        }
    });

    // if no setting create new one
    if (!setting) {
      const newSetting = this.getRepository(GeneralSetting).create({});
      setting = await this.getRepository(GeneralSetting).save(newSetting);
    }

    // cache the data
    await this.cacheManager.set(cacheKey, setting, 0);

    return setting;
  }

  private async removeCache() {
    const keys = await this.cacheManager.keys();

    const filteredKeys = keys?.filter((key) => key.startsWith(CACHE_KEYS.GEN_SET));

    await this.cacheManager.mdel(...filteredKeys);
  }
}
