import { Body, Controller, Get, Param, Post, UseInterceptors } from '@nestjs/common';
import { FeePaymentsService } from './fee-payments.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateFeePaymentDto } from './dto/create-fee-payment.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';

@ApiBearerAuth()
@ApiTags('Fee Payments')
@Controller('fee-payments')
export class FeePaymentsController {
  constructor(private readonly feePaymentsService: FeePaymentsService) { }

  @Post()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  @UseInterceptors(TransactionInterceptor)
  create(@Body() dto: CreateFeePaymentDto) {
    return this.feePaymentsService.create(dto);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.feePaymentsService.findOne(id);
  }

}
