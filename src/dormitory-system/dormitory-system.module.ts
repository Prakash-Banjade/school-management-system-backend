import { Module } from '@nestjs/common';
import { RoomTypesModule } from './room-types/room-types.module';
import { DormitoryRoomsModule } from './dormitory-rooms/dormitory-rooms.module';
import { DormitoriesModule } from './dormitories/dormitories.module';
import { RouterModule } from '@nestjs/core';

@Module({
    imports: [
        RoomTypesModule,
        DormitoryRoomsModule,
        DormitoriesModule,
        RouterModule.register([
            {
                path: 'dormitory-system',
                module: RoomTypesModule,
            },
            {
                path: 'dormitory-system',
                module: DormitoriesModule,
            },
            {
                path: 'dormitory-system',
                module: DormitoryRoomsModule,
            }
        ])
    ]
})
export class DormitorySystemModule { }
