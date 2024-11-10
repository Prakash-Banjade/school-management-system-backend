import { Module } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teacher } from './entities/teacher.entity';
import { AccountsModule } from 'src/auth-system/accounts/accounts.module';
import { ImagesModule } from 'src/file-management/images/images.module';
import { TeachersHelper } from './helpers/teacher.helper';
import { TeachersStudentViewService } from './teachers.student-view.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Teacher]),
    AccountsModule,
    ImagesModule,
  ],
  controllers: [TeachersController],
  providers: [TeachersService, TeachersHelper, TeachersStudentViewService],
  exports: [TeachersService],
})
export class TeachersModule { }
