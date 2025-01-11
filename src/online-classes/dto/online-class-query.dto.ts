import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class OnlineClassQueryDto extends QueryDto {
    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    classRoomId?: string

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