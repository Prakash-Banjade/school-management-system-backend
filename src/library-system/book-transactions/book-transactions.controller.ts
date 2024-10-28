import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors } from '@nestjs/common';
import { BookTransactionsService } from './book-transactions.service';
import { CreateBookTransactionDto } from './dto/create-book-transaction.dto';
import { UpdateBookTransactionDto } from './dto/update-book-transaction.dto';
import { ApiTags } from '@nestjs/swagger';
import { ChekcAbilities } from 'src/common/decorators/abilities.decorator';
import { Action } from 'src/common/types/global.type';
import { QueryDto } from 'src/common/dto/query.dto';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';

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
  findAll(@Query() queryDto: QueryDto) {
    return this.bookTransactionsService.findAll(queryDto);
  }

  @Get(':id')
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.bookTransactionsService.findOne(id);
  }

  @Patch(':id')
  @ChekcAbilities({ subject: 'all', action: Action.UPDATE })
  update(@Param('id') id: string, @Body() updateBookTransactionDto: UpdateBookTransactionDto) {
    return this.bookTransactionsService.update(id, updateBookTransactionDto);
  }

  @Delete(':id')
  @ChekcAbilities({ subject: 'all', action: Action.DELETE })
  remove(@Param('id') id: string) {
    return this.bookTransactionsService.remove(id);
  }
}
