import { BadRequestException } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty, IsString, ValidateIf } from "class-validator";

export class CreateAcademicYearDto {
    @ApiProperty({ format: 'date-time', example: '2022-01-01T00:00:00.000Z', description: 'Start date of the academic year' })
    @IsNotEmpty()
    @IsDateString()
    startDate: string;

    @ApiProperty({ format: 'date-time', example: '2022-01-01T00:00:00.000Z', description: 'End date of the academic year' })
    @IsNotEmpty()
    @IsDateString()
    @ValidateIf((o: CreateAcademicYearDto) => {
        if (isNaN(Date.parse(o.endDate))) throw new BadRequestException('End date is not a valid date');
        if (new Date(o.endDate) < new Date(o.startDate)) throw new BadRequestException('End date cannot be less than start date');

        return true;
    })
    endDate: string;

    @ApiProperty({ example: "2022-2023", type: String, description: 'Name of the academic year' })
    @IsNotEmpty()
    @IsString()
    name: string;
}
