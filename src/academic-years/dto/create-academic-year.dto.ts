import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateAcademicYearDto {
    @ApiProperty({ format: 'date-time', example: '2022-01-01T00:00:00.000Z' })
    @IsNotEmpty()
    @IsDateString()
    startDate: string;
    
    @ApiProperty({ format: 'date-time', example: '2022-01-01T00:00:00.000Z' })
    @IsNotEmpty()
    @IsDateString()
    endDate: string;

    @ApiProperty({ example: "2022-2023", type: String })
    @IsNotEmpty()
    @IsString()
    name?: string = ''
}
