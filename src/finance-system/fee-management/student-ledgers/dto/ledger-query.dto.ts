import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, IsUUID } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class LedgerQueryDto extends QueryDto {
    @ApiPropertyOptional({ format: 'uuid', description: 'Student id' })
    @IsUUID()
    @IsOptional()
    studentId?: string;

    @ApiPropertyOptional({ format: 'date-time', description: 'Date from' })
    @IsDateString()
    @IsOptional()
    dateFrom?: string;

    @ApiPropertyOptional({ format: 'date-time', description: 'Date to' })
    @IsDateString()
    @IsOptional()
    dateTo?: string;

    @ApiPropertyOptional({ description: 'Particular', enum: ['invoice', 'payment', 'all'], default: 'all' })
    @IsString()
    @IsOptional()
    particular: 'invoice' | 'payment' | 'all' = 'all';
}