import { Module } from '@nestjs/common';
import { StaffsService } from './staffs.service';
import { StaffsController } from './staffs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Staff } from './entities/staff.entity';
import { ImagesModule } from 'src/file-management/images/images.module';
import { AccountsModule } from 'src/auth-system/accounts/accounts.module';
import { StaffsHelper } from './helpers/staffs.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Staff,
    ]),
    ImagesModule,
    AccountsModule,
  ],
  controllers: [StaffsController],
  providers: [StaffsService, StaffsHelper],
  exports: [StaffsService],
})
export class StaffsModule { }
