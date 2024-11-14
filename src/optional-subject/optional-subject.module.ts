import { Module } from '@nestjs/common';
import { OptionalSubjectService } from './optional-subject.service';
import { OptionalSubjectController } from './optional-subject.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OptionalSubject } from './entities/optional-subject.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OptionalSubject,
    ])
  ],
  controllers: [OptionalSubjectController],
  providers: [OptionalSubjectService],
})
export class OptionalSubjectModule { }
