import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CreateExamDto } from './create-exam.dto';
import { ArrayMinSize, IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateExamSubjectDto } from 'src/examination-system/exam-subjects/dto/create-exam-subject.dto';

class ExamSubject extends OmitType(CreateExamSubjectDto, ['examId']) {
    @ApiPropertyOptional({ format: 'uuid', description: 'Exam subject id' })
    @IsUUID()
    @IsOptional()
    id?: string; // id of the examSubject to be updated
}

export class UpdateExamDto extends PartialType(OmitType(CreateExamDto, ['classRoomId', 'examSubjects', 'examTypeId'])) {
    @ApiProperty({ type: ExamSubject, isArray: true, description: 'Exam subjects' })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => ExamSubject)
    examSubjects: ExamSubject[];
}
