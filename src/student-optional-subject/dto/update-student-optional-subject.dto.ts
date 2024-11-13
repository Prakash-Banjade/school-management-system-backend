import { PartialType } from '@nestjs/swagger';
import { CreateStudentOptionalSubjectDto } from './create-student-optional-subject.dto';

export class UpdateStudentOptionalSubjectDto extends PartialType(CreateStudentOptionalSubjectDto) {}
