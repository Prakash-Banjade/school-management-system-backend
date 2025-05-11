import { Body, Controller, Get, Param, Patch, Post, Query, UseInterceptors } from '@nestjs/common';
import { PayrollsService } from './payrolls.service';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetEmployeesQueryDto, PayrollsQueryDto } from './dto/payroll-query.dto';
import { PayrollsHelper } from './helpers/payrolls.helper';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { CreatePayrollDto, UpdatePayrollDto } from './dto/payroll.dto';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { CurrentUser } from 'src/common/decorators/user.decorator';

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
  create(@Body() createPayrollDto: CreatePayrollDto, @CurrentUser() currentUser: AuthUser) {
    return this.payrollsService.create(createPayrollDto, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payrolls' })
  @ApiResponse({ status: 200, description: 'Payrolls fetched successfully' })
  @CheckAbilities(
    { subject: Role.TEACHER, action: Action.READ },
    { subject: Role.ADMIN, action: Action.READ }
  )
  getAll(@Query() queryDto: PayrollsQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.payrollsService.getAll(queryDto, currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payroll by id' })
  @ApiResponse({ status: 200, description: 'Payroll fetched successfully' })
  @ApiNotFoundResponse({ description: 'Payroll not found' })
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.TEACHER, action: Action.READ },
  )
  findOne(@Param('id') id: string, @CurrentUser() currentUser: AuthUser) {
    return this.payrollsService.findOne(id, currentUser);
  }

  @Get('employees')
  @ApiOperation({ summary: 'Get list of employees' })
  @ApiResponse({ status: 200, description: 'Employees fetched successfully' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getEmployees(@Query() queryDto: GetEmployeesQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.payrollsHelper.getEmployees(queryDto, currentUser);
  }

  @Get('salary-employee')
  @ApiOperation({ summary: 'Get details of a specific employee' })
  @ApiParam({ name: 'employeeId', required: true, description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Employee details fetched successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getSalaryEmployee(@Query('employeeId') employeeId: string, @CurrentUser() currentUser: AuthUser) {
    return this.payrollsHelper.getEmployee(employeeId, currentUser);
  }

  @Get('employees/last-payroll')
  @ApiOperation({ summary: 'Get the last payroll of an employee' })
  @ApiParam({ name: 'employeeId', required: true, description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Last payroll fetched successfully' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getLastPayroll(@Query('employeeId') employeeId: string) {
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
