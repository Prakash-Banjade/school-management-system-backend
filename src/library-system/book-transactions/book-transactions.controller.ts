import { Controller, Get, Post, Body, Patch, Param, Query, UseInterceptors } from '@nestjs/common';
import { BookTransactionsService } from './book-transactions.service';
import { CreateBookTransactionDto } from './dto/create-book-transaction.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { BookTransactionByMemberQueryDto, BookTransactionsQueryDto, UnpaidTransactionsQueryDto } from './dto/book-transactions-query.dto';
import { RenewBookTransactionDto, ReturnBookTransactionDto } from './dto/update-book-transaction.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { BookTransactionsStudentViewService } from './book-transactions-student-view.service';
import { BookTransactionsHelper } from './helpers/book-transactinos.helper';
import { isStudent } from 'src/utils/utils';
import { MAX_BOOK_ISSUE_LIMIT } from 'src/common/CONSTANTS';

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
  @ApiOperation({ summary: 'Create a new book transaction' })
  @ApiResponse({ status: 201, description: 'The book transaction has been successfully created.' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @ApiResponse({ status: 400, description: 'This student has an overdue transaction. Please make the payment first.' })
  @ApiResponse({ status: 400, description: 'Book is already issued. Please renew or return.' })
  @ApiResponse({ status: 400, description: `Maximum of ${MAX_BOOK_ISSUE_LIMIT} book issues allowed.` })
  @ApiResponse({ status: 400, description: `Book is not available` })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  @UseInterceptors(TransactionInterceptor)
  create(@Body() dto: CreateBookTransactionDto) {
    return this.bookTransactionsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all book transactions' })
  @ApiResponse({ status: 200, description: 'The book transactions have been successfully retrieved.' })
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.STUDENT, action: Action.READ }
  )
  findAll(@Query() queryDto: BookTransactionsQueryDto, @CurrentUser() currentUser: AuthUser) {
    return isStudent(currentUser)
      ? this.bookTransactionsStudentViewService.findAll(queryDto, currentUser)
      : this.bookTransactionsService.findAll(queryDto);
  }

  @Get('member')
  @ApiOperation({ summary: 'Get all book transactions of particular member' })
  @ApiResponse({ status: 200, description: 'The book transactions have been successfully retrieved.' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAllByMember(@Query() queryDto: BookTransactionByMemberQueryDto) {
    return this.bookTransactionsService.findAllByMember(queryDto);
  }

  @Get('unpaid')
  @ApiOperation({ summary: 'Get all unpaid book transactions' })
  @ApiResponse({ status: 200, description: 'The book transactions have been successfully retrieved.' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findUnpaid(@Query() queryDto: UnpaidTransactionsQueryDto) {
    return this.bookTransactionsHelper.getUnPaidTransactions(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single book transaction' })
  @ApiResponse({ status: 200, description: 'The book transaction has been successfully retrieved.' })
  @ApiResponse({ status: 404, description: 'Book transaction not found' })
  @ApiParam({ name: 'id', type: 'string', description: 'The id of the book transaction' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.bookTransactionsService.findOne(id);
  }

  @Patch('return')
  @ApiOperation({ summary: 'Return books' })
  @ApiResponse({ status: 200, description: 'The books have been successfully returned.' })
  @ApiResponse({ status: 404, description: 'Book transaction not found' })
  @UseInterceptors(TransactionInterceptor)
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  update(@Body() dto: ReturnBookTransactionDto) {
    return this.bookTransactionsService.returnBook(dto.transactionIds);
  }

  @Patch('renew')
  @ApiOperation({ summary: 'Renew books' })
  @ApiResponse({ status: 200, description: 'The books have been successfully renewed.' })
  @ApiResponse({ status: 400, description: 'Due date must be greater than the current due date' })
  @ApiResponse({ status: 404, description: 'Book transaction not found' })
  @UseInterceptors(TransactionInterceptor)
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  renew(@Body() dto: RenewBookTransactionDto) {
    return this.bookTransactionsService.renewBookTransaction(dto.transactionIds, dto.dueDate);
  }
}
