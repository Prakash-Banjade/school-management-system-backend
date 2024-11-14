import { PartialType } from '@nestjs/swagger';
import { CreateOptionalSubjectDto } from './create-optional-subject.dto';

export class UpdateOptionalSubjectDto extends PartialType(CreateOptionalSubjectDto) {}
