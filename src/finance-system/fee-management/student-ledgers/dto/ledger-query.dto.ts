import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, IsUUID } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class LedgerQueryDto extends QueryDto {
    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    studentId?: string;
    
    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    dateFrom?: string;

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    dateTo?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    particular: 'invoice' | 'payment' | 'all' = 'all';
}