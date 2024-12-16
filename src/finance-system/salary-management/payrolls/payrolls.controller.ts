import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseInterceptors } from '@nestjs/common';
import { PayrollsService } from './payrolls.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetEmployeesQueryDto } from './dto/payroll-query.dto';
import { PayrollsHelper } from './helpers/payrolls.helper';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { CreatePayrollDto, UpdatePayrollDto } from './dto/payroll.dto';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';

@ApiBearerAuth()
@ApiTags('Payrolls')
@Controller('payrolls')
export class PayrollsController {
  constructor(
    private readonly payrollsService: PayrollsService,
    private readonly payrollsHelper: PayrollsHelper,
  ) { }

  @Post()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  @UseInterceptors(TransactionInterceptor)
  create(@Body() createPayrollDto: CreatePayrollDto) {
    return this.payrollsService.create(createPayrollDto);
  }

  @Get('employees')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getEmployees(@Query() queryDto: GetEmployeesQueryDto) {
    return this.payrollsHelper.getEmployees(queryDto);
  }

  @Get('employees/:employeeId')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getEmployee(@Param('employeeId') employeeId: string) {
    return this.payrollsHelper.getEmployee(employeeId);
  }

  @Get('employees/:employeeId/last-payroll')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getLastPayroll(@Param('employeeId') employeeId: string) {
    return this.payrollsService.getLastPayroll(employeeId);
  }

  @Patch(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  @UseInterceptors(TransactionInterceptor)
  update(@Param('id') id: string, @Body() updatePayrollDto: UpdatePayrollDto) {
    return this.payrollsService.update(id, updatePayrollDto);
  }
}
