import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString } from "class-validator";
import { ClassWithSectionQueryDto } from "src/common/dto/classWithSectionQuery.dto";

export class LessonPlanQueryDto extends ClassWithSectionQueryDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    subjectId?: string;

    @ApiPropertyOptional()
    @IsString({ each: true })
    @IsOptional()
    @Transform(({ value }) => {
        if (value) return value.split(',');
        return [];
    })
    status?: string[]
}