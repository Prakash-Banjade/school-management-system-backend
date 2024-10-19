import { Module } from '@nestjs/common';
import { ExamTypesService } from './exam-types.service';
import { ExamTypesController } from './exam-types.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamType } from './entities/exam-type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExamType,
    ])
  ],
  controllers: [ExamTypesController],
  providers: [ExamTypesService],
  exports: [ExamTypesService],
})
export class ExamTypesModule {}
