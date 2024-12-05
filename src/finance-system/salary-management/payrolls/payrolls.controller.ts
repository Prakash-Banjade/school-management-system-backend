import { Controller, Get, Query } from '@nestjs/common';
import { PayrollsService } from './payrolls.service';
import { ApiTags } from '@nestjs/swagger';
import { GetEmployeesQueryDto } from './dto/payroll-query.dto';
import { PayrollsHelper } from './helpers/payrolls.helper';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';

@ApiTags('Payrolls')
@Controller('payrolls')
export class PayrollsController {
  constructor(
    private readonly payrollsService: PayrollsService,
    private readonly payrollsHelper: PayrollsHelper,
  ) { }

  @Get('employees')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getEmployees(@Query() queryDto: GetEmployeesQueryDto) {
    return this.payrollsHelper.getEmployees(queryDto);
  }
}
