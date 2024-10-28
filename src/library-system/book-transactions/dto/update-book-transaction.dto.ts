import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateBookTransactionDto } from './create-book-transaction.dto';

export class UpdateBookTransactionDto extends PartialType(OmitType(CreateBookTransactionDto, ['studentId'])) { }
