import { Body, Controller, Get, Param, Patch, Post, Query, UseInterceptors } from '@nestjs/common';
import { PayrollsService } from './payrolls.service';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create a payroll entry' })
  @ApiResponse({ status: 201, description: 'Payroll created successfully' })
  @ApiResponse({ status: 400, description: 'Payroll already created for this month' })
  @ApiResponse({ status: 400, description: 'Something seems wrong with the salary structure or adjustments' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  @UseInterceptors(TransactionInterceptor)
  create(@Body() createPayrollDto: CreatePayrollDto) {
    return this.payrollsService.create(createPayrollDto);
  }

  @Get('employees')
  @ApiOperation({ summary: 'Get list of employees' })
  @ApiResponse({ status: 200, description: 'Employees fetched successfully' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getEmployees(@Query() queryDto: GetEmployeesQueryDto) {
    return this.payrollsHelper.getEmployees(queryDto);
  }

  @Get('employees/:employeeId')
  @ApiOperation({ summary: 'Get details of a specific employee' })
  @ApiParam({ name: 'employeeId', required: true, description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Employee details fetched successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getEmployee(@Param('employeeId') employeeId: string) {
    return this.payrollsHelper.getEmployee(employeeId);
  }

  @Get('employees/:employeeId/last-payroll')
  @ApiOperation({ summary: 'Get the last payroll of an employee' })
  @ApiParam({ name: 'employeeId', required: true, description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Last payroll fetched successfully' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getLastPayroll(@Param('employeeId') employeeId: string) {
    return this.payrollsService.getLastPayroll(employeeId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing payroll entry' })
  @ApiParam({ name: 'id', required: true, description: 'Payroll ID' })
  @ApiResponse({ status: 200, description: 'Payroll updated successfully' })
  @ApiResponse({ status: 404, description: 'Payroll not found' })
  @ApiResponse({ status: 403, description: 'This payroll cannot be updated now' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  @UseInterceptors(TransactionInterceptor)
  update(@Param('id') id: string, @Body() updatePayrollDto: UpdatePayrollDto) {
    return this.payrollsService.update(id, updatePayrollDto);
  }
}
