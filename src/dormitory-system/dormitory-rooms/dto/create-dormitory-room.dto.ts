import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Min } from "class-validator";

export class CreateDormitoryRoomDto {
    @ApiProperty({ type: String, description: 'Room name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ type: Number, description: 'Room number' })
    @IsInt()
    @IsNotEmpty()
    @Min(1)
    roomNumber: number;

    @ApiProperty({ type: Number, description: 'Number of beds in the room' })
    @IsInt()
    @IsNotEmpty()
    @IsPositive()
    noOfBeds: number;

    @ApiProperty({ type: Number, description: 'Cost per bed' })
    @IsNumber()
    @IsNotEmpty()
    @Min(1)
    costPerBed: number;

    @ApiPropertyOptional({ type: String, description: 'Description of the room' })
    @IsString()
    @IsOptional()
    description: string;

    @ApiProperty({ format: 'uuid', description: 'Room type id' })
    @IsNotEmpty()
    @IsUUID()
    roomTypeId: string;

    @ApiProperty({ format: 'uuid', description: 'Dormitory id' })
    @IsNotEmpty()
    @IsUUID()
    dormitoryId: string;
}
