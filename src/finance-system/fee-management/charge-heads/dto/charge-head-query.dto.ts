import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsString } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class ChargeHeadQueryDto extends QueryDto {
    @ApiPropertyOptional({ type: 'string', isArray: true, description: 'Charge head types' })
    @IsString({ each: true })
    @IsOptional()
    @Transform(({ value }) => value ? value.split(',') : [])
    types?: string[];

    @ApiPropertyOptional({ type: 'string', description: 'Class room id' })
    @IsString()
    @IsOptional()
    classRoomId?: string;

    @ApiPropertyOptional({ type: 'boolean', description: 'Include defaults' })
    @IsBoolean()
    @Transform(({ value }) => {
        return value === 'true';
    })
    defaults?: boolean = true;
}

export class ChargeHeadOptionsQueryDto extends QueryDto {
    @ApiPropertyOptional({ type: 'boolean', description: 'Include period' })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    includePeriod: boolean = true;

    @ApiPropertyOptional({ type: 'boolean', description: 'Include period' })
    @IsBoolean()
    @Transform(({ value }) => {
        return value === 'true';
    })
    defaults?: boolean = true;

    @ApiPropertyOptional({ type: 'string', description: 'Charge head type' })
    @IsString()
    @IsOptional()
    type?: string;

    @ApiPropertyOptional({ type: 'string', description: 'Class room id' })
    @IsString()
    @IsOptional()
    classRoomId?: string;
}