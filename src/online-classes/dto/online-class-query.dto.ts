import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsUUID } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class OnlineClassQueryDto extends QueryDto {
    @ApiPropertyOptional()
    @IsUUID()
    classRoomId?: string

    @ApiPropertyOptional()
    @IsUUID()
    subjectId?: string

    @ApiPropertyOptional()
    @IsUUID()
    teacherId?: string

    @ApiPropertyOptional()
    @IsString()
    dateFrom?: string;

    @ApiPropertyOptional()
    @IsString()
    dateTo?: string;
}