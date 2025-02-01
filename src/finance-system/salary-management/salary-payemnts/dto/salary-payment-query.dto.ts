import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsUUID } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class SalaryPaymentQueryDto extends QueryDto {
    @ApiPropertyOptional({
        type: String,
        format: 'uuid',
        description: 'Filter by the employee ID to retrieve salary payments for a specific employee.',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsUUID()
    @IsOptional()
    employeeId?: string;

    @ApiPropertyOptional({
        type: String,
        format: 'date-time',
        description: 'Start date for filtering salary payments. Must be in ISO 8601 format.',
        example: '2024-02-01T00:00:00.000Z',
    })
    @IsDateString()
    @IsOptional()
    dateFrom?: string;

    @ApiPropertyOptional({
        type: String,
        format: 'date-time',
        description: 'End date for filtering salary payments. Must be in ISO 8601 format.',
        example: '2024-02-29T23:59:59.999Z',
    })
    @IsDateString()
    @IsOptional()
    dateTo?: string;
}
