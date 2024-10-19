import { Module } from '@nestjs/common';
import { RoomTypesModule } from './room-types/room-types.module';
import { DormitoryRoomsModule } from './dormitory-rooms/dormitory-rooms.module';
import { DormitoriesModule } from './dormitories/dormitories.module';

@Module({
    imports: [
        RoomTypesModule,
        DormitoryRoomsModule,
        DormitoriesModule,
    ]
})
export class DormitorySystemModule { }
