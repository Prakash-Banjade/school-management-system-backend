import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsUUID } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class ExamSubjectQueryDto extends QueryDto {
    @ApiPropertyOptional({ format: 'uuid' })
    @IsOptional()
    @IsUUID()
    examId: string;

    @ApiPropertyOptional({ type: Boolean, default: false })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    onlyPast: boolean = false;

    @ApiPropertyOptional({ type: Boolean, default: false })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    includeEvaluations: boolean = false;
}