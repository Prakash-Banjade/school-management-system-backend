import { Controller, Get, Body, Patch, Query } from '@nestjs/common';
import { GeneralSettingsService } from './general-settings.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GeneralSettingDto } from './dto/general-setting.dto';
import { GeneralSettingQueryDto } from './dto/general-setting-query.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';

@ApiBearerAuth()
@ApiTags('General Settings')
@Controller('general-settings')
export class GeneralSettingsController {
  constructor(private readonly generalSettingsService: GeneralSettingsService) { }

  @Patch()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  setSettings(@Body() dto: GeneralSettingDto) {
    return this.generalSettingsService.set(dto);
  }

  @Get()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getSettings(@Query() queryDto: GeneralSettingQueryDto) {
    return this.generalSettingsService.get(queryDto);
  }
}
