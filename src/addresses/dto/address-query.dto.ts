import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { ECountry } from "src/common/types/country.type";

export class AddressQueryDto {
    @ApiPropertyOptional({ type: String, description: 'Address 1' })
    @IsString()
    @IsOptional()
    address1?: string;

    @ApiPropertyOptional({ type: String, description: 'Address 2' })
    @IsString()
    @IsOptional()
    address2?: string;

    @ApiPropertyOptional({ type: String, description: 'City' })
    @IsString()
    @IsOptional()
    city?: string;

    @ApiPropertyOptional({ type: 'enum', enum: ECountry, description: 'Country' })
    @IsOptional()
    country?: string;

    @ApiPropertyOptional({ type: String, description: 'Province' })
    @IsString()
    @IsOptional()
    province?: string;

    @ApiPropertyOptional({ type: Number, description: 'Zip Code' })
    @IsOptional()
    zipCode?: number;
}
