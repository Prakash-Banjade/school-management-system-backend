import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";
import { ClassWithSectionQueryDto } from "src/common/dto/classWithSectionQuery.dto";
import { ETask } from "src/common/types/global.type";

export class TaskQueryDto extends ClassWithSectionQueryDto {

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    subjectId?: string;

    @ApiPropertyOptional()
    @IsEnum(ETask)
    @IsOptional()
    taskType?: ETask;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === "true")
    overdue?: boolean;
}