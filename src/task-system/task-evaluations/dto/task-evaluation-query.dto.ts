import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class TaskEvaluationQueryDto extends QueryDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    taskId?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    subjectId?: string
}