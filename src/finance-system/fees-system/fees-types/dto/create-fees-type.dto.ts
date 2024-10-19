import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class CreateFeesTypeDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ type: Number, format: 'double' })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    amount: number;

    @ApiProperty({ format: 'uuid' })
    @IsNotEmpty()
    @IsUUID()
    feeGroupId: string;
}
