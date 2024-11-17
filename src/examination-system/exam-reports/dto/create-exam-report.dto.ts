import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsOptional, IsUUID, Min, ValidateNested } from "class-validator";

class ExamEvaluationDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    studentId: string;

    @ApiProperty({ type: Number, minimum: 0 })
    @IsNumber()
    @IsNotEmpty()
    @Min(0, { message: 'Theory marks must be greater than 0' })
    theoryOM: number;

    @ApiProperty({ type: Number, minimum: 0 })
    @IsNumber()
    @IsNotEmpty()
    @Min(0, { message: 'Practical marks must be greater than 0' })
    practicalOM: number;

    @ApiPropertyOptional({ format: 'uuid' })
    @IsOptional()
    @IsUUID()
    reportId?: string;
}

export class CreateExamReportDto {
    @ApiProperty({ type: ExamEvaluationDto, isArray: true })
    @IsArray()
    @ArrayMinSize(1, { message: 'At least one evaluation is required' })
    @ValidateNested({ each: true })
    @Type(() => ExamEvaluationDto)
    evaluations: ExamEvaluationDto[];

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    examSubjectId: string;
}
