import { Module } from '@nestjs/common';
import { DormitoriesService } from './dormitories.service';
import { DormitoriesController } from './dormitories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dormitory } from './entities/dormitory.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Dormitory,
    ])
  ],
  controllers: [DormitoriesController],
  providers: [DormitoriesService],
  exports: [DormitoriesService],
})
export class DormitoriesModule {}
