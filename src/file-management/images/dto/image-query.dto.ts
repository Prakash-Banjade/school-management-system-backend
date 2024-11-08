import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class ImageQueryDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    w?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    q?: string;
}