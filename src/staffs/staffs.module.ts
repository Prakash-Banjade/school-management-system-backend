import { Module } from '@nestjs/common';
import { StaffsService } from './staffs.service';
import { StaffsController } from './staffs.controller';
import { ImagesModule } from 'src/file-management/images/images.module';
import { AccountsModule } from 'src/auth-system/accounts/accounts.module';
import { StaffsHelper } from './helpers/staffs.helper';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Staff } from './entities/staff.entity';
import { StaffUtilsService } from './helpers/staffs-utils.service';
import { FilesModule } from 'src/file-management/files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Staff]),
    ImagesModule,
    FilesModule,
    AccountsModule,
  ],
  controllers: [StaffsController],
  providers: [StaffsService, StaffsHelper, StaffUtilsService],
  exports: [StaffsService],
})
export class StaffsModule { }
