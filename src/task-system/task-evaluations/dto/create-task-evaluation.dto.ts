import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, IsUUID, Length, Max, Min } from "class-validator";

export class CreateTaskEvaluationDto {
    @ApiProperty({ type: 'string', format: 'uuid', description: "Task submission id" })
    @IsUUID()
    taskSubmissionId: string;

    @ApiPropertyOptional({ type: 'number', description: "Score for the submission" })
    @IsNumber()
    @Min(0, { message: 'Score must be greater than 0' })
    @Max(100, { message: 'Score must be less than 100' })
    @IsOptional()
    score?: number;

    @ApiProperty({ type: 'string', description: "Feedback for the submission" })
    @IsString()
    @Length(1, 200, { message: 'Feedback must be between 1 and 200 characters' })
    feedback: string;
}
