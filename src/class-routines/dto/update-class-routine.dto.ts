import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateClassRoutineDto } from './create-class-routine.dto';

export class UpdateClassRoutineDto extends PartialType(OmitType(CreateClassRoutineDto, ['subjectId'])) { }
