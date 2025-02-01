import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class FacultyOptionsQueryDto extends QueryDto {
    @ApiPropertyOptional({ enum: ['classRoom', 'section'], description: 'Include classRoom or section' })
    @IsString()
    @IsOptional()
    include?: 'classRoom' | 'section';

    @ApiPropertyOptional({ description: 'Flag to determine the output. If true, returns the key value pair else returns id and name.' })
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    keyValue: boolean;
}