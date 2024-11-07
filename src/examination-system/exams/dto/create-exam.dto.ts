import { ApiProperty, OmitType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsNotEmpty, IsUUID, ValidateNested } from "class-validator";
import { CreateExamSubjectDto } from "src/examination-system/exam-subjects/dto/create-exam-subject.dto";

class ExamSubject extends OmitType(CreateExamSubjectDto, ['examId', 'subjectId']) { }

export class CreateExamDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    @IsNotEmpty()
    examTypeId: string;

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    @IsNotEmpty()
    classRoomId: string;

    @ApiProperty({ type: ExamSubject, isArray: true })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => ExamSubject)
    examSubjects: ExamSubject[];
}
