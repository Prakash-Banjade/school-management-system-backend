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
}