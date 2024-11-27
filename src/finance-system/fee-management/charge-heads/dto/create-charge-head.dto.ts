import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, Length } from "class-validator";
import { EChargeHeadPeriod, EChargeHeadType } from "../entities/charge-head.entity";

export class CreateChargeHeadDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 200, { message: 'Description must be less than 200 characters' })
    description?: string;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    isMandatory?: boolean;

    @ApiPropertyOptional()
    @IsEnum(EChargeHeadPeriod)
    @IsOptional()
    period?: EChargeHeadPeriod;

    @ApiPropertyOptional()
    @IsEnum(EChargeHeadType)
    @IsOptional()
    type?: EChargeHeadType;
}
