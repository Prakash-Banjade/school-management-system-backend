import { Module } from '@nestjs/common';
import { GeneralSettingsService } from './general-settings.service';
import { GeneralSettingsController } from './general-settings.controller';
import { GeneralSetting } from './entities/general-setting.entity';

@Module({
  imports: [
    GeneralSetting
  ],
  controllers: [GeneralSettingsController],
  providers: [GeneralSettingsService],
})
export class GeneralSettingsModule { }
