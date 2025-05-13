import { Body, Controller, Get, Param, Post, Query, UseInterceptors } from '@nestjs/common';
import { SalaryPaymentsService } from './salary-payments.service';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { CreateSalaryPaymentDto } from './dto/create-salary-payment.dto';
import { SalaryPaymentQueryDto } from './dto/salary-payment-query.dto';
import { SalaryPayment } from './entities/salary-payment.entity';
import { CurrentUser } from 'src/common/decorators/user.decorator';

@ApiBearerAuth()
@ApiTags('Salary Payments')
@Controller('salary-payments')
export class SalaryPaymentsController {
  constructor(private readonly salaryPaymentsService: SalaryPaymentsService) { }

  @Post()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  @UseInterceptors(TransactionInterceptor)
  @ApiOperation({ summary: 'Create a salary payment' })
  @ApiResponse({ status: 201, description: 'Salary payment created successfully', type: SalaryPayment })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() dto: CreateSalaryPaymentDto) {
    return this.salaryPaymentsService.create(dto);
  }

  @Get()
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.TEACHER, action: Action.READ }
  )
  @ApiOperation({ summary: 'Get all salary payments' })
  @ApiResponse({ status: 200, description: 'Returns a list of salary payments', type: [SalaryPayment] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  findAll(@Query() queryDto: SalaryPaymentQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.salaryPaymentsService.findAll(queryDto, currentUser);
  }

  @Get(':id')
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.TEACHER, action: Action.READ }
  )
  @ApiOperation({ summary: 'Get salary payment by id' })
  @ApiOkResponse({ description: 'Returns a salary payment by id', type: [SalaryPayment] })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: AuthUser) {
    return this.salaryPaymentsService.findOne(id, currentUser);
  }
}
