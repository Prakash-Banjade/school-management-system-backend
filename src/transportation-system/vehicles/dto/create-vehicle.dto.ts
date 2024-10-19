import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateVehicleDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    vehicleNumber: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    vehicleModel: string;

    @ApiProperty()
    @IsInt()
    @IsNotEmpty()
    yearMade: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    note: string

    @ApiProperty({ format: 'uuid' })
    @IsNotEmpty()
    @IsUUID()
    staffId: string;

    @ApiPropertyOptional({ format: 'uuid' })
    @IsUUID()
    @IsOptional()
    transportRouteId: string;
}
