import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { QueryDto } from "./query.dto";

export class ClassWithSectionQueryDto extends QueryDto {
    @ApiPropertyOptional({ type: String, description: 'Search by classRoom' })
    @IsString()
    @IsOptional()
    classRoomId: string;

    @ApiPropertyOptional({ type: String, description: 'Search by section' })
    @IsString()
    @IsOptional()
    sectionId: string;
}