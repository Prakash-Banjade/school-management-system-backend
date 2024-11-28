import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional } from "class-validator";

export class GeneralSettingDto {
    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    libraryFine?: number;
}
