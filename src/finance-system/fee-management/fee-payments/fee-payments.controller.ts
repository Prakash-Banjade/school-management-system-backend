import { Body, Controller, Get, Param, Post, UseInterceptors } from '@nestjs/common';
import { FeePaymentsService } from './fee-payments.service';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateFeePaymentDto, LibraryFinePaymentDto } from './dto/create-fee-payment.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';

@ApiBearerAuth()
@ApiTags('Fee Payments')
@Controller('fee-payments')
export class FeePaymentsController {
  constructor(private readonly feePaymentsService: FeePaymentsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a fee payment' })
  @ApiResponse({ status: 201, description: 'Fee payment created successfully' })
  @ApiResponse({ status: 400, description: 'Cannot create fee payment from past academic year' })
  @ApiResponse({ status: 404, description: 'Payment amount cannot be greater than the outstanding amount' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  @UseInterceptors(TransactionInterceptor)
  create(@Body() dto: CreateFeePaymentDto) {
    return this.feePaymentsService.create(dto);
  }

  @Post('library-fine')
  @ApiOperation({ summary: 'Receive library fine' })
  @ApiResponse({ status: 201, description: 'Library fine received successfully' })
  @ApiResponse({ status: 400, description: 'Cannot receive library fine from past academic year' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @ApiResponse({ status: 404, description: 'No unpaid transactions found' })
  @ApiResponse({ status: 500, description: 'Library fine charge head not found' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  @UseInterceptors(TransactionInterceptor)
  receiveLibraryFine(@Body() dto: LibraryFinePaymentDto) {
    return this.feePaymentsService.receiveLibraryFine(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a fee payment' })
  @ApiResponse({ status: 200, description: 'Fee payment found successfully' })
  @ApiResponse({ status: 404, description: 'Fee payment not found' })
  @ApiParam({ name: 'id', description: 'Fee payment id', required: true })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.feePaymentsService.findOne(id);
  }

}
