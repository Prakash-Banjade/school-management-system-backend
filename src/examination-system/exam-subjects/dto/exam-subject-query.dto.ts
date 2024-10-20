import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsUUID } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class ExamSubjectQueryDto extends QueryDto {
    @ApiPropertyOptional({ format: 'uuid' })
    @IsOptional()
    @IsUUID()
    examId: string;
}