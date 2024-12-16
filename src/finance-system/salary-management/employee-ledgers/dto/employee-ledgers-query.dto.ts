import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsUUID } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class EmployeeLedgerQueryDto extends QueryDto {
    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    employeeId?: string;

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    dateFrom?: string;

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    dateTo?: string;
}