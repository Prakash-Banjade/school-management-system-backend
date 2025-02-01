import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, Length } from "class-validator";
import { EChargeHeadPeriod, EChargeHeadType } from "../entities/charge-head.entity";

export class CreateChargeHeadDto {
    @ApiProperty({ type: String, description: 'Charge head name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ type: String, description: 'Charge head description' })
    @IsOptional()
    @IsString()
    @Length(0, 200, { message: 'Description must be less than 200 characters' })
    description?: string;

    @ApiPropertyOptional({ type: Boolean, description: 'Is charge head mandatory' })
    @IsBoolean()
    @IsOptional()
    isMandatory?: boolean;

    @ApiPropertyOptional({ type: String, enum: EChargeHeadPeriod, description: 'Charge head period' })
    @IsEnum(EChargeHeadPeriod)
    @IsOptional()
    period?: EChargeHeadPeriod;

    @ApiPropertyOptional({ type: String, enum: EChargeHeadType, description: 'Charge head type' })
    @IsEnum(EChargeHeadType)
    @IsOptional()
    type?: EChargeHeadType;
}
