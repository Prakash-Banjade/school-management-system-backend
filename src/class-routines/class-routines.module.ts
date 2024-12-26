import { Module } from '@nestjs/common';
import { ClassRoutinesService } from './class-routines.service';
import { ClassRoutinesController } from './class-routines.controller';

@Module({
  imports: [],
  controllers: [ClassRoutinesController],
  providers: [ClassRoutinesService],
})
export class ClassRoutinesModule { }
