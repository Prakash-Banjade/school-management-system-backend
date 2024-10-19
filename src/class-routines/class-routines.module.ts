import { Module } from '@nestjs/common';
import { ClassRoutinesService } from './class-routines.service';
import { ClassRoutinesController } from './class-routines.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassRoutine } from './entities/class-routine.entity';
import { ClassRoomsModule } from 'src/class-rooms/class-rooms.module';
import { SubjectsModule } from 'src/subjects/subjects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClassRoutine,
    ]),
    ClassRoomsModule,
    SubjectsModule,
  ],
  controllers: [ClassRoutinesController],
  providers: [ClassRoutinesService],
})
export class ClassRoutinesModule { }
