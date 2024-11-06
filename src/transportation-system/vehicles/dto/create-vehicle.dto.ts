import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Length, Max, Min } from "class-validator";
import { EVehicleType } from "src/common/types/global.type";

export class CreateVehicleDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    vehicleNumber: string;

    @ApiProperty()
    @IsEnum(EVehicleType)
    type: EVehicleType;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    vehicleModel: string;

    @ApiProperty()
    @IsInt()
    @Min(1)
    @Max(100)
    capacity: number;

    @ApiProperty()
    @IsInt()
    @Min(1990)
    @Max(new Date().getFullYear())
    yearMade: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    @Length(1, 200, { message: 'Note should not exceed 200 characters' })
    note?: string

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    @IsOptional()
    driverId?: string;
}
