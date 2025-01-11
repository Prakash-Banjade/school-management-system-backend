import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from './datasource/typeorm.module';
import { AuthSystemModule } from './auth-system/auth-system.module';
import { FileManagementModule } from './file-management/file-management.module';
import { MemoryStoredFile, NestjsFormDataModule } from 'nestjs-form-data';
import { MailModule } from './mail/mail.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthGuard } from './common/guards/auth.guard';
import { DormitorySystemModule } from './dormitory-system/dormitory-system.module';
import { FinanceSystemModule } from './finance-system/finance-system.module';
import { AcademicYearsModule } from './academic-years/academic-years.module';
import { AttendancesModule } from './attendances/attendances.module';
import { ClassRoomsModule } from './class-rooms/class-rooms.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ExaminationSystemModule } from './examination-system/examination-system.module';
import { GuardiansModule } from './guardians/guardians.module';
import { NoticesModule } from './notices/notices.module';
import { StaffsModule } from './staffs/staffs.module';
import { StudentsModule } from './students/students.module';
import { SubjectsModule } from './subjects/subjects.module';
import { TeachersModule } from './teachers/teachers.module';
import { TransportationSystemModule } from './transportation-system/transportation-system.module';
import { ClassRoutinesModule } from './class-routines/class-routines.module';
import { AbilitiesGuard } from './common/guards/abilities.guard';
import { CaslModule } from './auth-system/casl/casl.module';
import { LeaveRequestsModule } from './leave-requests/leave-requests.module';
import { LibrarySystemModule } from './library-system/library-system.module';
import { TaskSystemModule } from './task-system/task-system.module';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DashboardModule } from './dashboard/dashboard.module';
import { OptionalSubjectModule } from './optional-subject/optional-subject.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EventsModule } from './events/events.module';
import { GeneralSettingsModule } from './general-settings/general-settings.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { BranchesModule } from './branches/branches.module';
import { UtilitiesModule } from './utilities/utilities.module';
import { EnvModule } from './env/env.module';
import { LessonPlansModule } from './lesson-plans/lesson-plans.module';
import { FacultiesModule } from './faculties/faculties.module';
import { OnlineClassesModule } from './online-classes/online-classes.module';

@Module({
  imports: [
    EnvModule,
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
    CacheModule.registerAsync({
      imports: [ConfigModule],
      isGlobal: true,
      useFactory: async (configService: ConfigService) => {
        const store = await redisStore({
          url: configService.get<string>('REDIS_URL'),
        });

        return {
          store: store as unknown as CacheStore,
          ttl: 1 * 60000, // 1 minute (milliseconds)
          max: 1000,
        };
      },
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'wwwroot'),
    }),
    TypeOrmModule,
    AuthSystemModule,
    FileManagementModule,
    MailModule,
    CaslModule,
    DormitorySystemModule,
    FinanceSystemModule,
    AcademicYearsModule,
    AttendancesModule,
    FacultiesModule,
    ClassRoomsModule,
    ClassRoutinesModule,
    EnrollmentsModule,
    ExaminationSystemModule,
    GuardiansModule,
    NoticesModule,
    StaffsModule,
    LeaveRequestsModule,
    StudentsModule,
    SubjectsModule,
    TeachersModule,
    TransportationSystemModule,
    LibrarySystemModule,
    TaskSystemModule,
    DashboardModule,
    OptionalSubjectModule,
    EventsModule,
    GeneralSettingsModule,
    BranchesModule,
    UtilitiesModule,
    LessonPlansModule,
    OnlineClassesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard, // global auth guard
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // global rate limiting, but can be overriden in route level
    },
    {
      provide: APP_GUARD,
      useClass: AbilitiesGuard, // global ability guard, this should be defined after AuthGuard, because it depends on the request['user'] which is defined by AuthGuard
    },
  ],
})
export class AppModule { }
