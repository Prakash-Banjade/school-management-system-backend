import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Length, Max } from "class-validator";

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
}
