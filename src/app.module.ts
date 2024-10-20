import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from './datasource/typeorm.module';
import { AuthSystemModule } from './auth-system/auth-system.module';
import { FileManagementModule } from './file-management/file-management.module';
import { MemoryStoredFile, NestjsFormDataModule } from 'nestjs-form-data';
import { MailModule } from './mail/mail.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthGuard } from './common/guards/auth.guard';
import { envSchema } from './env.schema';
import { DormitorySystemModule } from './dormitory-system/dormitory-system.module';
import { FinanceSystemModule } from './finance-system/finance-system.module';
import { AcademicYearsModule } from './academic-years/academic-years.module';
import { AddressesModule } from './addresses/addresses.module';
import { AttendancesModule } from './attendances/attendances.module';
import { ClassRoomsModule } from './class-rooms/class-rooms.module';
import { DealersModule } from './dealers/dealers.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ExaminationSystemModule } from './examination-system/examination-system.module';
import { GuardiansModule } from './guardians/guardians.module';
import { LibraryBookModule } from './library-book/library-book.module';
import { NoticesModule } from './notices/notices.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { StaffsModule } from './staffs/staffs.module';
import { StudentsModule } from './students/students.module';
import { SubjectsModule } from './subjects/subjects.module';
import { TasksModule } from './tasks/tasks.module';
import { TeachersModule } from './teachers/teachers.module';
import { TransportationSystemModule } from './transportation-system/transportation-system.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envSchema,
    }),
    NestjsFormDataModule.config({
      storage: MemoryStoredFile,
      isGlobal: true,
      fileSystemStoragePath: 'public',
      autoDeleteFile: false,
      limits: {
        files: 10,
        fileSize: 5 * 1024 * 1024,
      },
      cleanupAfterSuccessHandle: false, // !important
    }),
    ThrottlerModule.forRoot([{
      ttl: 1000, // 5 req per second
      limit: 5,
    }]),
    TypeOrmModule,
    AuthSystemModule,
    FileManagementModule,
    MailModule,
    DormitorySystemModule,
    FinanceSystemModule,
    AcademicYearsModule,
    AddressesModule,
    AttendancesModule,
    ClassRoomsModule,
    DealersModule,
    EnrollmentsModule,
    ExaminationSystemModule,
    GuardiansModule,
    LibraryBookModule,
    NoticesModule,
    RecommendationsModule,
    StaffsModule,
    StudentsModule,
    SubjectsModule,
    TasksModule,
    TeachersModule,
    TransportationSystemModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // global rate limiting, but can be overriden in route level
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard, // global auth guard
    },
  ],
})
export class AppModule { }
