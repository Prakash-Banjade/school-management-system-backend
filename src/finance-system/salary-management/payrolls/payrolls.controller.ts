import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PayrollsService } from './payrolls.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetEmployeesQueryDto } from './dto/payroll-query.dto';
import { PayrollsHelper } from './helpers/payrolls.helper';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { CreatePayrollDto } from './dto/create-payroll.dto';

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
}
