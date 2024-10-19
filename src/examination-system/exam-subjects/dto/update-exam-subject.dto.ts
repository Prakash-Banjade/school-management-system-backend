import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateExamSubjectDto } from './create-exam-subject.dto';

export class UpdateExamSubjectDto extends PartialType(OmitType(CreateExamSubjectDto, ['subjectId', 'examId'])) { }
