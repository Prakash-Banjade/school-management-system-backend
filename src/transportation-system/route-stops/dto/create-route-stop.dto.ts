import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsMilitaryTime, IsNotEmpty, IsNumber, IsString, IsUUID, Min } from "class-validator";

export class CreateRouteStopDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    location: string;

    @ApiProperty()
    @IsNumber()
    @Min(1)
    fare: number;

    @ApiProperty()
    @IsInt()
    @Min(1)
    sequence: number;

    @ApiProperty()
    @IsMilitaryTime({ message: "Invalid pick up time. Required format: HH:MM" })
    @IsNotEmpty()
    pickUpTime: string;

    @ApiProperty()
    @IsMilitaryTime({ message: "Invalid drop off time. Required format: HH:MM" })
    @IsNotEmpty()
    dropOffTime: string;

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    vehicleId: string;

    @ApiProperty()
    @IsNumber()
    @Min(1, { message: "Distance must be greater than 0" })
    distance: number;
}
