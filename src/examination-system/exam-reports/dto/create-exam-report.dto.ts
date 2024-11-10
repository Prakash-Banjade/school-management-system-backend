import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsUUID, Min, ValidateNested } from "class-validator";

class StudentMark {
    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    examSubjectId: string;

    @ApiProperty({ type: Number, minimum: 0 })
    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    obtainedMarks: number;
}

class ExamEvaluation {
    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    studentId: string;

    @ApiProperty({ type: StudentMark, isArray: true })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => StudentMark)
    marks: StudentMark[];
}

export class CreateExamReportDto {
    @ApiProperty({ type: ExamEvaluation, isArray: true })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => ExamEvaluation)
    evaluations: ExamEvaluation[];
}
