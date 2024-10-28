import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";
import { EBookTransactionStatus } from "src/common/types/global.type";

export class BookTransactionsQueryDto extends QueryDto {
    @ApiPropertyOptional({ type: String, enum: EBookTransactionStatus })
    @IsOptional()
    @IsString()
    status: EBookTransactionStatus;
}