import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString } from "class-validator";

export class GeneralSettingQueryDto {
    @ApiPropertyOptional()
    @IsString({ each: true })
    @IsOptional()
    @Transform(({ value }) => value ? value.split(',') : [])
    settings?: string[];
}