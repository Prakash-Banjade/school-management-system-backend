import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDefined, IsOptional, IsString } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";
import { EBookTransactionStatus } from "src/common/types/global.type";

export class BookTransactionsQueryDto extends QueryDto {
    @ApiPropertyOptional({ type: String, enum: EBookTransactionStatus })
    @IsOptional()
    @IsString()
    status: EBookTransactionStatus;
}

export class BookTransactionByStudentQueryDto extends BookTransactionsQueryDto {
    @ApiProperty({ type: String })
    @IsString()
    @IsDefined()
    studentId: string;
}