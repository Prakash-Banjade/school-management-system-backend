import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class GeneralSettingDto {
    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    libraryFine?: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    currency?: string;
}
