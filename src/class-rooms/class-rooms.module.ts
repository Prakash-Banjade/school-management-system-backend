import { Module } from '@nestjs/common';
import { ClassRoomsService } from './class-rooms.service';
import { ClassRoomsController } from './class-rooms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassRoom } from './entities/class-room.entity';
import { ClassRoomsHelper } from './helpers/class-rooms.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClassRoom,
    ]),
  ],
  controllers: [ClassRoomsController],
  providers: [ClassRoomsService, ClassRoomsHelper],
  exports: [ClassRoomsService],
})
export class ClassRoomsModule { }
