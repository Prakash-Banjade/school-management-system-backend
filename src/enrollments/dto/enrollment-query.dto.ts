import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { ClassRoomSearchQueryDto } from "src/common/dto/classRoomSearchQueryDto";

export class EnrollmentQueryDto extends ClassRoomSearchQueryDto {
    @ApiPropertyOptional({ type: 'string', description: 'Start date' })
    @IsString()
    @IsOptional()
    dateFrom?: string;

    @ApiPropertyOptional({ type: 'string', description: 'End date' })
    @IsString()
    @IsOptional()
    dateTo?: string;
}