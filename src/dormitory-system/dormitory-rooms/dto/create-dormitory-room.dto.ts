import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateDormitoryRoomDto {
    @ApiProperty({ type: Number })
    @IsInt()
    @IsNotEmpty()
    roomNumber: number;

    @ApiProperty({ type: Number })
    @IsInt()
    @IsNotEmpty()
    noOfBeds: number;

    @ApiProperty({ type: Number })
    @IsNumber()
    @IsNotEmpty()
    costPerBed: number;

    @ApiPropertyOptional({ type: String })
    @IsString()
    @IsOptional()
    description: string;

    @ApiProperty({ format: 'uuid' })
    @IsNotEmpty()
    @IsUUID()
    roomTypeId: string;

    @ApiProperty({ format: 'uuid' })
    @IsNotEmpty()
    @IsUUID()
    dormitoryId: string;
}
