import { ApiProperty } from "@nestjs/swagger";
import { IsDateString } from "class-validator";

export class EmployeeAttendanceQueryDto {
    @ApiProperty({ type: String, format: 'date-time', description: 'Date of the attendance' })
    @IsDateString()
    date: string;
}