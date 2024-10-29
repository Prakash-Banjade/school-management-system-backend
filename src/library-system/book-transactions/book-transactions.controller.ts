import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors } from '@nestjs/common';
import { BookTransactionsService } from './book-transactions.service';
import { CreateBookTransactionDto } from './dto/create-book-transaction.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChekcAbilities } from 'src/common/decorators/abilities.decorator';
import { Action } from 'src/common/types/global.type';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { BookTransactionByStudentQueryDto, BookTransactionsQueryDto } from './dto/book-transactions-query.dto';
import { RenewBookTransactionDto, ReturnBookTransactionDto } from './dto/update-book-transaction.dto';

@ApiBearerAuth()
@ApiTags('Library Book Transactions')
@Controller('book-transactions')
export class BookTransactionsController {
  constructor(private readonly bookTransactionsService: BookTransactionsService) { }

  @Post()
  @ChekcAbilities({ subject: 'all', action: Action.CREATE })
  @UseInterceptors(TransactionInterceptor)
  create(@Body() createBookTransactionDto: CreateBookTransactionDto) {
    return this.bookTransactionsService.create(createBookTransactionDto);
  }

  @Get()
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  findAll(@Query() queryDto: BookTransactionsQueryDto) {
    return this.bookTransactionsService.findAll(queryDto);
  }

  @Get('student')
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  findAllByStudent(@Query() queryDto: BookTransactionByStudentQueryDto) {
    return this.bookTransactionsService.findAllByStudent(queryDto);
  }

  @Get(':id')
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.bookTransactionsService.findOne(id);
  }

  @Patch('return')
  @UseInterceptors(TransactionInterceptor)
  @ChekcAbilities({ subject: 'all', action: Action.UPDATE })
  update(@Body() updateBookTransactionDto: ReturnBookTransactionDto) {
    return this.bookTransactionsService.returnBook(updateBookTransactionDto.transactionIds);
  }

  @Patch('renew')
  @UseInterceptors(TransactionInterceptor)
  @ChekcAbilities({ subject: 'all', action: Action.UPDATE })
  renew(@Body() updateBookTransactionDto: RenewBookTransactionDto) {
    return this.bookTransactionsService.renewBookTransaction(updateBookTransactionDto.transactionIds, updateBookTransactionDto.dueDate);
  }

  @Delete(':id')
  @ChekcAbilities({ subject: 'all', action: Action.DELETE })
  remove(@Param('id') id: string) {
    return this.bookTransactionsService.remove(id);
  }
}
