import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateBookTransactionDto } from './create-book-transaction.dto';
import { IsDateString, IsUUID } from 'class-validator';
import { IsFutureDate } from 'src/common/decorators/isFutureDate.decorator';

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
    @IsFutureDate({ message: 'The due date must be in the future.' })
    dueDate: string;
}