import { Global, Module } from '@nestjs/common';
import { GeneralSettingsService } from './general-settings.service';
import { GeneralSettingsController } from './general-settings.controller';
import { GeneralSetting } from './entities/general-setting.entity';

@Global()
@Module({
  imports: [
    GeneralSetting
  ],
  controllers: [GeneralSettingsController],
  providers: [GeneralSettingsService],
  exports: [GeneralSettingsService], 
})
export class GeneralSettingsModule { }
