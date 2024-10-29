import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateBookTransactionDto } from './create-book-transaction.dto';
import { IsDateString, IsUUID } from 'class-validator';

export class UpdateBookTransactionDto extends PartialType(OmitType(CreateBookTransactionDto, ['studentId'])) { }

export class ReturnBookTransactionDto {

    @ApiProperty({ type: String, isArray: true })
    @IsUUID('4', { each: true })
    transactionIds: string[];
}

export class RenewBookTransactionDto {
    @ApiProperty({ type: String, isArray: true })
    @IsUUID('4', { each: true })
    transactionIds: string[];

    @ApiProperty({ type: String })    
    @IsDateString()
    dueDate: string;
}