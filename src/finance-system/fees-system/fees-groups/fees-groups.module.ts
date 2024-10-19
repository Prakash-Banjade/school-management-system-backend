import { Module } from '@nestjs/common';
import { FeesGroupsService } from './fees-groups.service';
import { FeesGroupsController } from './fees-groups.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeesGroup } from './entities/fees-group.entity';
import { ClassRoomsModule } from 'src/class-rooms/class-rooms.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeesGroup,
    ]),
    ClassRoomsModule,
  ],
  controllers: [FeesGroupsController],
  providers: [FeesGroupsService],
  exports: [FeesGroupsService],
})
export class FeesGroupsModule {}
