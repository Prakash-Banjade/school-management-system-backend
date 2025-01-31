import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsUUID } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class EmployeeLedgerQueryDto extends QueryDto {
    @ApiPropertyOptional({ format: 'uuid', description: 'Employee id' })
    @IsUUID()
    @IsOptional()
    employeeId?: string;

    @ApiPropertyOptional({ format: 'date-time', description: 'Date from' })
    @IsDateString()
    @IsOptional()
    dateFrom?: string;

    @ApiPropertyOptional({ format: 'date-time', description: 'Date to' })
    @IsDateString()
    @IsOptional()
    dateTo?: string;
}