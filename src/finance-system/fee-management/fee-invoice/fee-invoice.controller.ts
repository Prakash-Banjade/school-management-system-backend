import { Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { FeeInvoiceService } from './fee-invoice.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateFeeInvoiceDto } from './dto/create-fee-invoice.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';

@ApiBearerAuth()
@ApiTags('Fee Invoices')
@Controller('fee-invoices')
export class FeeInvoiceController {
  constructor(private readonly feeInvoiceService: FeeInvoiceService) { }

  @Post()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  @UseInterceptors(TransactionInterceptor)
  create(@Body() dto: CreateFeeInvoiceDto) {
    return this.feeInvoiceService.create(dto);
  }
}
