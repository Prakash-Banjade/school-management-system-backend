import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, IsUUID, Length, Max, Min } from "class-validator";

export class CreateTaskEvaluationDto {
    @ApiProperty()
    @IsUUID()
    taskSubmissionId: string;

    @ApiPropertyOptional()
    @IsNumber()
    @Min(0, { message: 'Score must be greater than 0' })
    @Max(100, { message: 'Score must be less than 100' })
    @IsOptional()
    score?: number;

    @ApiProperty()
    @IsString()
    @Length(1, 500, { message: 'Feedback must be between 1 and 500 characters' })
    feedback: string;
}
