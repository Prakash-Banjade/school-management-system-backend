import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { QueryDto } from "./query.dto";

export class ClassRoomSearchQueryDto extends QueryDto {
    @ApiPropertyOptional({ type: "string", description: 'Search by classRoom' })
    @IsString()
    @IsOptional()
    facultyId?: string;

    @ApiPropertyOptional({ type: "string", description: 'Search by classRoom' })
    @IsString()
    @IsOptional()
    classRoomId?: string;

    @ApiPropertyOptional({ type: "string", description: 'Search by section' })
    @IsString()
    @IsOptional()
    sectionId?: string;
}