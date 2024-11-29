import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors } from '@nestjs/common';
import { BookTransactionsService } from './book-transactions.service';
import { CreateBookTransactionDto } from './dto/create-book-transaction.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { BookTransactionByStudentQueryDto, BookTransactionsQueryDto, UnpaidTransactionsQueryDto } from './dto/book-transactions-query.dto';
import { RenewBookTransactionDto, ReturnBookTransactionDto } from './dto/update-book-transaction.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { isStudent } from 'src/utils/isStudent';
import { BookTransactionsStudentViewService } from './book-transactions-student-view.service';
import { BookTransactionsHelper } from './helpers/book-transactinos.helper';

@ApiBearerAuth()
@ApiTags('Library Book Transactions')
@Controller('book-transactions')
export class BookTransactionsController {
  constructor(
    private readonly bookTransactionsService: BookTransactionsService,
    private readonly bookTransactionsHelper: BookTransactionsHelper,
    private readonly bookTransactionsStudentViewService: BookTransactionsStudentViewService,
  ) { }

  @Post()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  @UseInterceptors(TransactionInterceptor)
  create(@Body() createBookTransactionDto: CreateBookTransactionDto) {
    return this.bookTransactionsService.create(createBookTransactionDto);
  }

  @Get()
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.STUDENT, action: Action.READ }
  )
  findAll(@Query() queryDto: BookTransactionsQueryDto, @CurrentUser() currentUser: AuthUser) {
    return isStudent(currentUser)
      ? this.bookTransactionsStudentViewService.findAll(queryDto, currentUser)
      : this.bookTransactionsService.findAll(queryDto);
  }

  @Get('student')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAllByStudent(@Query() queryDto: BookTransactionByStudentQueryDto) {
    return this.bookTransactionsService.findAllByStudent(queryDto);
  }

  @Get('unpaid')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findUnpaid(@Query() queryDto: UnpaidTransactionsQueryDto) {
    return this.bookTransactionsHelper.getUnPaidTransactions(queryDto);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.bookTransactionsService.findOne(id);
  }

  @Patch('return')
  @UseInterceptors(TransactionInterceptor)
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  update(@Body() updateBookTransactionDto: ReturnBookTransactionDto) {
    return this.bookTransactionsService.returnBook(updateBookTransactionDto.transactionIds);
  }

  @Patch('renew')
  @UseInterceptors(TransactionInterceptor)
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  renew(@Body() updateBookTransactionDto: RenewBookTransactionDto) {
    return this.bookTransactionsService.renewBookTransaction(updateBookTransactionDto.transactionIds, updateBookTransactionDto.dueDate);
  }
}
