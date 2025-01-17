import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class FacultiesQueryDto extends QueryDto {
    @ApiPropertyOptional()
    @IsString({ each: true })
    @IsOptional()
    @Transform(({ value }) => value ? value.split(',') : [])
    degreeLevels?: string[];
}

export class FacultyOptionsQueryDto extends QueryDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    include?: 'classRoom' | 'section';

    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    keyValue: boolean;
}