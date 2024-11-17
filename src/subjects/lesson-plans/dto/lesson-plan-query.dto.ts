import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { ClassWithSectionQueryDto } from "src/common/dto/classWithSectionQuery.dto";
import { QueryDto } from "src/common/dto/query.dto";

export class LessonPlanQueryDto extends ClassWithSectionQueryDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    subjectId?: string;
}