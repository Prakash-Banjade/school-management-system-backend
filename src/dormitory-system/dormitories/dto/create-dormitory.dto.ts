import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { EDormitoryType } from "src/common/types/global.type";

export class CreateDormitoryDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ enum: EDormitoryType })
    @IsEnum(EDormitoryType)
    @IsNotEmpty()
    type: EDormitoryType;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    address: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    intake: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description: string;
}
