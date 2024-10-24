import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Min } from "class-validator";

export class CreateDormitoryRoomDto {
    @ApiProperty({ type: Number })
    @IsInt()
    @IsNotEmpty()
    @Min(1)
    roomNumber: number;

    @ApiProperty({ type: Number })
    @IsInt()
    @IsNotEmpty()
    @IsPositive()
    noOfBeds: number;

    @ApiProperty({ type: Number })
    @IsNumber()
    @IsNotEmpty()
    @Min(1)
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
