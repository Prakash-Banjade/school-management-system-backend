import { PartialType } from '@nestjs/swagger';
import { CreateMarksGradeDto } from './create-marks-grade.dto';

export class UpdateMarksGradeDto extends PartialType(CreateMarksGradeDto) {}
