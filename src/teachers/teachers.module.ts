import { Module } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';
import { AccountsModule } from 'src/auth-system/accounts/accounts.module';
import { ImagesModule } from 'src/file-management/images/images.module';
import { TeachersHelper } from './helpers/teacher.helper';
import { TeachersStudentViewService } from './teachers.student-view.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teacher } from './entities/teacher.entity';
import { TeacherUtilsService } from './helpers/teacher-utils.service';
import { BookTransactionsModule } from 'src/library-system/book-transactions/book-transactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Teacher,
    ]),
    AccountsModule,
    ImagesModule,
    BookTransactionsModule,
  ],
  controllers: [TeachersController],
  providers: [TeachersService, TeachersHelper, TeachersStudentViewService, TeacherUtilsService],
  exports: [TeachersService],
})
export class TeachersModule { }
