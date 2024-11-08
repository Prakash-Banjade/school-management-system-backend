import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString } from "class-validator";
import { ClassWithSectionQueryDto } from "src/common/dto/classWithSectionQuery.dto";

export class ExamQueryDto extends ClassWithSectionQueryDto {
    @ApiPropertyOptional({ isArray: true })
    @IsString({ each: true })
    @IsOptional()
    @Transform(({ value }) => {
        if (value) return value.split(',');
        return [];
    })
    examTypes?: string[]; // exam type name array
}