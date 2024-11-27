import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsString, IsUUID } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class ChargeHeadQueryDto extends QueryDto {
    @ApiPropertyOptional()
    @IsString({ each: true })
    @IsOptional()
    @Transform(({ value }) => value ? value.split(',') : [])
    types?: string[];

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    classRoomId?: string;

    @ApiPropertyOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        return value === 'true';
    })
    defaults?: boolean = true;
}

export class ChargeHeadOptionsQueryDto extends QueryDto {
    @ApiPropertyOptional({ default: true })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    includePeriod: boolean = true;

    @ApiPropertyOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        return value === 'true';
    })
    defaults?: boolean = true;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    type?: string;
}