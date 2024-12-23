import { Module } from '@nestjs/common';
import { ClassRoomsService } from './class-rooms.service';
import { ClassRoomsController } from './class-rooms.controller';
import { ClassRoomsHelper } from './helpers/class-rooms.helper';
import { ClassRoomsStatistics } from './helpers/class-rooms.statistics';
import { FeeStructuresModule } from 'src/finance-system/fee-management/fee-structures/fee-structures.module';

@Module({
  imports: [
    FeeStructuresModule,
  ],
  controllers: [ClassRoomsController],
  providers: [ClassRoomsService, ClassRoomsHelper, ClassRoomsStatistics],
  exports: [ClassRoomsService],
})
export class ClassRoomsModule { }
