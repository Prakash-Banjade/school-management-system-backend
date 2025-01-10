import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { ClassRoomSearchQueryDto } from "src/common/dto/classRoomSearchQueryDto";

export class EnrollmentQueryDto extends ClassRoomSearchQueryDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    dateFrom?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    dateTo?: string;
}