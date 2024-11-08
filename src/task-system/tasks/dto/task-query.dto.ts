import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";
import { ETask } from "src/common/types/global.type";

export class TaskQueryDto extends QueryDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    classRoomId?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    sectionId?: string;

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