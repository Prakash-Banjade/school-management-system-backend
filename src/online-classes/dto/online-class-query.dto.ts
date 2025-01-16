import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString, IsUUID } from "class-validator";
import { ClassRoomSearchQueryDto } from "src/common/dto/classRoomSearchQueryDto";

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

    @ApiPropertyOptional()
    @IsString({ each: true })
    @IsOptional()
    @Transform(({ value }) => {
        if (value) return value.split(',');
        return [];
    })
    status?: string[] = []
}