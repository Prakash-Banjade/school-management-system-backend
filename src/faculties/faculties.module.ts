import { Module } from '@nestjs/common';
import { FacultiesService } from './faculties.service';
import { FacultiesController } from './faculties.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Faculty } from './entities/faculty.entity';
import { ClassRoom } from 'src/class-rooms/entities/class-room.entity';
import { FacultiesHelper } from './helper/faculties.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Faculty,
      ClassRoom,
    ])
  ],
  controllers: [FacultiesController],
  providers: [
    FacultiesService,
    FacultiesHelper,
  ],
})
export class FacultiesModule { }
