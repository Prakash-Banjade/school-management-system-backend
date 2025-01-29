import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateRoomTypeDto {
    @ApiProperty({ type: String, description: 'Room type name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ type: String, description: 'Room type description' })
    @IsString()
    @IsOptional()
    description?: string;
}
