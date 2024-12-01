import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString } from "class-validator";
import { GeneralSetting } from "../entities/general-setting.entity";

export class GeneralSettingQueryDto {
    @ApiPropertyOptional()
    @IsString({ each: true })
    @IsOptional()
    @Transform(({ value }) => {
        return typeof value === 'string'
            ? value.split(',')
            : Array.isArray(value)
                ? value
                : [];
    })
    settings?: (keyof GeneralSetting | 'all')[];
}