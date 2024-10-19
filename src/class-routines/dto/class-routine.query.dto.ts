import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";
import { EDayOfWeek, ERoutineType } from "src/common/types/global.type";

export class ClassRoutineQueryDto extends QueryDto {
    @ApiPropertyOptional({ enum: EDayOfWeek })
    @IsString()
    @IsOptional()
    dayOfTheWeek: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    startTime: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    endTime: string;

    @ApiPropertyOptional({ enum: ERoutineType })
    @IsString()
    @IsOptional()
    type: string;

    @ApiPropertyOptional({ format: 'uuid' })
    @IsString()
    @IsOptional()
    classRoomId: string;

    @ApiPropertyOptional({ format: 'uuid' })
    @IsString()
    @IsOptional()
    subjectId: string;
}