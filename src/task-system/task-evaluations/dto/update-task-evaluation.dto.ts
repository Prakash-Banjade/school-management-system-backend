import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateTaskEvaluationDto } from './create-task-evaluation.dto';

export class UpdateTaskEvaluationDto extends PartialType(OmitType(CreateTaskEvaluationDto, ["taskSubmissionId"])) {}
