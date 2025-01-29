import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateBookTransactionDto } from './create-book-transaction.dto';
import { ArrayMinSize, IsArray, IsDateString, IsUUID } from 'class-validator';
import { IsFutureDate } from 'src/common/decorators/validators/isFutureDate.decorator';

export class UpdateBookTransactionDto extends PartialType(OmitType(CreateBookTransactionDto, ['studentId'])) { }

export class ReturnBookTransactionDto {

    @ApiProperty({ type: "string", isArray: true, description: 'Book Transaction ids' })
    @IsUUID('4', { each: true })
    @IsArray()
    @ArrayMinSize(1)
    transactionIds: string[];
}

export class RenewBookTransactionDto {
    @ApiProperty({ type: "string", isArray: true, description: 'Book Transaction ids' })
    @IsUUID('4', { each: true })
    @IsArray()
    @ArrayMinSize(1)
    transactionIds: string[];

    @ApiProperty({ type: String, description: 'Due date' })
    @IsDateString()
    @IsFutureDate({ message: 'The due date must be in the future.' })
    dueDate: string;
}