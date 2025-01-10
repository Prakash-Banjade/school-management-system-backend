import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";
import { ClassRoomSearchQueryDto } from "src/common/dto/classRoomSearchQueryDto";
import { ETask } from "src/common/types/global.type";

export class TaskQueryDto extends ClassRoomSearchQueryDto {

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