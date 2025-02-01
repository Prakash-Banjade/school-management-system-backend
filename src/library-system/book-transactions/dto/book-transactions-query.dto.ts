import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDefined, IsEnum, IsOptional, IsString } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";
import { EBookTransactionStatus } from "src/common/types/global.type";

export enum EBookTransactionPeriod {
    TODAY = 'today',
    LAST_WEEK = 'last_week',
    THIS_MONTH = 'this_month',
    LAST_MONTH = 'last_month',
}

export class BookTransactionsQueryDto extends QueryDto {
    @ApiPropertyOptional({ type: String, enum: [...Object.values(EBookTransactionStatus), 'paid', 'unpaid'], description: "Status of the book transaction", default: EBookTransactionStatus.Issued })
    @IsOptional()
    @IsString()
    status: EBookTransactionStatus.Issued | EBookTransactionStatus.Returned | EBookTransactionStatus.Overdue | 'paid' | 'unpaid';

    @ApiPropertyOptional({ type: "string", enum: EBookTransactionPeriod, description: 'Period of the book transaction' })
    @IsOptional()
    @IsEnum(EBookTransactionPeriod)
    period?: EBookTransactionPeriod;

    @ApiPropertyOptional({ type: String, description: 'Paid flag for the book transaction' })
    @IsOptional()
    @IsString()
    paid?: string;
}

export class BookTransactionByStudentQueryDto extends BookTransactionsQueryDto {
    @ApiProperty({ type: String, format: 'uuid', description: 'Student id' })
    @IsString()
    @IsDefined()
    studentId: string;
}

export class UnpaidTransactionsQueryDto extends QueryDto {
    @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Student id' })
    @IsString()
    @IsOptional()
    studentId?: string;

    constructor(dto: Partial<UnpaidTransactionsQueryDto>) {
        super();
        Object.assign(this, dto);
    }
}