import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsUUID, Min, ValidateNested } from "class-validator";

class ExamEvaluationDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    studentId: string;

    @ApiProperty({ type: Number, minimum: 0 })
    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    obtainedMarks: number;
}

export class CreateExamReportDto {
    @ApiProperty({ type: ExamEvaluationDto, isArray: true })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => ExamEvaluationDto)
    evaluations: ExamEvaluationDto[];

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    examSubjectId: string;
}
