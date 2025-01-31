import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { ClassRoomSearchQueryDto } from "src/common/dto/classRoomSearchQueryDto";
import { EDayOfWeek, ERoutineType } from "src/common/types/global.type";

export class ClassRoutineQueryDto extends ClassRoomSearchQueryDto {
    @ApiPropertyOptional({ enum: EDayOfWeek, description: 'Day of the week' })
    @IsString()
    @IsOptional()
    dayOfTheWeek: string;

    @ApiPropertyOptional({ type: 'string', description: 'Start time' })
    @IsString()
    @IsOptional()
    startTime: string;

    @ApiPropertyOptional({ type: 'string', description: 'End time' })
    @IsString()
    @IsOptional()
    endTime: string;

    @ApiPropertyOptional({ enum: ERoutineType, description: 'Type of the routine' })
    @IsString()
    @IsOptional()
    type: string;

    @ApiPropertyOptional({ format: 'uuid', description: 'Class room ID' })
    @IsString()
    @IsOptional()
    classRoomId: string;

    @ApiPropertyOptional({ format: 'uuid', description: 'Subject ID' })
    @IsString()
    @IsOptional()
    subjectId: string;
}