import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { EDormitoryType } from "src/common/types/global.type";

export class CreateDormitoryDto {
    @ApiProperty({ type: String, description: 'Dormitory name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ enum: EDormitoryType, description: 'Dormitory type' })
    @IsEnum(EDormitoryType)
    @IsNotEmpty()
    type: EDormitoryType;

    @ApiPropertyOptional({ type: String, description: 'Dormitory address' })
    @IsString()
    @IsOptional()
    address: string;

    @ApiPropertyOptional({ type: String, description: 'Dormitory intake' })
    @IsString()
    @IsOptional()
    intake: string;

    @ApiPropertyOptional({ type: String, description: 'Dormitory description' })
    @IsString()
    @IsOptional()
    description: string;
}
