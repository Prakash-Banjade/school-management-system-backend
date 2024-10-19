import { Module } from '@nestjs/common';
import { MarksGradesService } from './marks-grades.service';
import { MarksGradesController } from './marks-grades.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarksGrade } from './entities/marks-grade.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MarksGrade,
    ])
  ],
  controllers: [MarksGradesController],
  providers: [MarksGradesService],
})
export class MarksGradesModule { }
