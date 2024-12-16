import { Body, Controller, Get, Post, Query, UseInterceptors } from '@nestjs/common';
import { SalaryPaymentsService } from './salary-payments.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { CreateSalaryPaymentDto } from './dto/create-salary-payment.dto';
import { SalaryPaymentQueryDto } from './dto/salary-payment-query.dto';

@ApiBearerAuth()
@ApiTags('Salary Payments')
@Controller('salary-payments')
export class SalaryPaymentsController {
  constructor(private readonly salaryPaymentsService: SalaryPaymentsService) { }

  @Post()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  @UseInterceptors(TransactionInterceptor)
  create(@Body() dto: CreateSalaryPaymentDto) {
    return this.salaryPaymentsService.create(dto);
  }

  @Get()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAll(@Query() queryDto: SalaryPaymentQueryDto) {
    return this.salaryPaymentsService.findAll(queryDto);
  }
}
