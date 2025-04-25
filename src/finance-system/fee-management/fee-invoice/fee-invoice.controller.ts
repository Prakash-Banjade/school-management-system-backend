import { Body, Controller, Get, Param, Post, UseInterceptors } from '@nestjs/common';
import { FeeInvoiceService } from './fee-invoice.service';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateFeeInvoiceDto } from './dto/create-fee-invoice.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { CurrentUser } from 'src/common/decorators/user.decorator';

@ApiBearerAuth()
@ApiTags('Fee Invoices')
@Controller('fee-invoices')
export class FeeInvoiceController {
  constructor(private readonly feeInvoiceService: FeeInvoiceService) { }

  @Post()
  @ApiOperation({ summary: 'Create Fee Invoice' })
  @ApiResponse({ status: 201, description: 'Fee Invoice created successfully' })
  @ApiResponse({ status: 400, description: 'Cannot create fee invoice for past academic year' })
  @ApiResponse({ status: 500, description: 'Ledger associated with student not found' })
  @ApiResponse({ status: 409, description: 'Invoice already exists for one time charge head' })
  @ApiResponse({ status: 400, description: 'Fee invoice for this month already exists' })
  @ApiResponse({ status: 404, description: 'Charge head not found' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  @UseInterceptors(TransactionInterceptor)
  create(@Body() dto: CreateFeeInvoiceDto) {
    return this.feeInvoiceService.create(dto);
  }

  @Get('last-invoice/:studentId')
  @ApiOperation({ summary: 'Get last invoice', description: "Get last invoice of the student by id. If no invoice, returns null." })
  @ApiResponse({ status: 200, description: 'Last invoice of the student returned successfully' })
  @ApiParam({ name: 'studentId', description: 'Id of the student' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getLastInvoice(@Param('studentId') studentId: string) {
    return this.feeInvoiceService.getLastInvoice(studentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fee invoice by id' })
  @ApiResponse({ status: 200, description: 'Fee invoice returned successfully' })
  @ApiResponse({ status: 404, description: 'Fee invoice not found' })
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.STUDENT, action: Action.READ }
  )
  findOne(@Param('id') id: string, @CurrentUser() currentUser: AuthUser) {
    return this.feeInvoiceService.findOne(id, currentUser);
  }
}
