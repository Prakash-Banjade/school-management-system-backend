import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class TaskSubmissionQueryDto extends QueryDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    @IsOptional()
    taskId?: string;

    @ApiPropertyOptional({ type: 'string', format: 'uuid', example: '' })
    @IsOptional()
    @IsString()
    subjectId: string;

    @ApiPropertyOptional({ type: 'boolean', description: 'Flag for not evaluated submissions' })
    @IsOptional()
    @IsString()
    notEvaluated?: boolean; // used by frontend to filter submissions that are not evaluated
}