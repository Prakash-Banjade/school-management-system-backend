import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";
import { ClassRoomOptionsQueryDto } from "src/class-rooms/dto/classRoom-query.dto";
import { ClassRoomSearchQueryDto } from "src/common/dto/classRoomSearchQueryDto";
import { QueryDto } from "src/common/dto/query.dto";

export class OnlineClassQueryDto extends ClassRoomSearchQueryDto {

    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    subjectId?: string

    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    teacherId?: string

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    dateFrom?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    dateTo?: string;
}