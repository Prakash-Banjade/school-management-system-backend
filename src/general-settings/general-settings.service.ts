import { Injectable } from '@nestjs/common';
import { GeneralSettingDto } from './dto/general-setting.dto';
import { IsNull, Not, Repository } from 'typeorm';
import { GeneralSettingQueryDto } from './dto/general-setting-query.dto';
import { GeneralSetting } from './entities/general-setting.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class GeneralSettingsService {
  constructor(
    @InjectRepository(GeneralSetting) private readonly generalSettingsRepo: Repository<GeneralSetting>,
  ) { }

  async set(dto: GeneralSettingDto) {
    const existing = await this.generalSettingsRepo.findOne({ where: { id: Not(IsNull()) } });

    if (existing) {
      Object.assign(existing, dto);
      await this.generalSettingsRepo.save(existing);
      return {
        message: 'Settings updated',
      }
    }

    const newSetting = this.generalSettingsRepo.create(dto);
    await this.generalSettingsRepo.save(newSetting);

    return { message: 'Settings updated' }
  }

  async get(queryDto: GeneralSettingQueryDto): Promise<GeneralSetting> {
    let setting = await this.generalSettingsRepo.findOne({
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
      const newSetting = this.generalSettingsRepo.create({});
      setting = await this.generalSettingsRepo.save(newSetting);
    }

    return setting;
  }
}
