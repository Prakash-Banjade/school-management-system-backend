import { PartialType } from '@nestjs/swagger';
import { CreateClassRoutineDto } from './create-class-routine.dto';

export class UpdateClassRoutineDto extends PartialType(CreateClassRoutineDto) { }
