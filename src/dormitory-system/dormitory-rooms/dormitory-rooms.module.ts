import { Module } from '@nestjs/common';
import { DormitoryRoomsService } from './dormitory-rooms.service';
import { DormitoryRoomsController } from './dormitory-rooms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DormitoryRoom } from './entities/dormitory-room.entity';
import { RoomTypesModule } from '../room-types/room-types.module';
import { DormitoriesModule } from '../dormitories/dormitories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DormitoryRoom
    ]),
    RoomTypesModule,
    DormitoriesModule,
  ],
  controllers: [DormitoryRoomsController],
  providers: [DormitoryRoomsService],
  exports: [DormitoryRoomsService],
})
export class DormitoryRoomsModule { }
