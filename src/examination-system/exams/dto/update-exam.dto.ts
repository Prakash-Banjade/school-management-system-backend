import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateExamDto } from './create-exam.dto';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateExamSubjectDto } from 'src/examination-system/exam-subjects/dto/create-exam-subject.dto';

class ExamSubject extends OmitType(CreateExamSubjectDto, ['examId']) { }

export class UpdateExamDto extends PartialType(OmitType(CreateExamDto, ['classRoomId', 'examSubjects'])) {
    @ApiProperty({ type: ExamSubject, isArray: true })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => ExamSubject)
    examSubjects: ExamSubject[];
}
