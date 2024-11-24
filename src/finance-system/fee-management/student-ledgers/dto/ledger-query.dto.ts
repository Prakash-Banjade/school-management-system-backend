import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class LedgerQueryDto extends QueryDto {
    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    studentId?: string;
    
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    dateFrom?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    dateTo?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    particular: 'invoice' | 'payment' | 'all' = 'all';
}