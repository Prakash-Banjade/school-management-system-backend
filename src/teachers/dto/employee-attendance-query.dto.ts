import { ApiProperty } from "@nestjs/swagger";
import { IsDateString } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class EmployeeAttendanceQueryDto extends QueryDto {
    @ApiProperty({ type: "string", format: 'date-time', description: 'Date of the attendance' })
    @IsDateString()
    date: string;
}