import { Controller, Get, Query } from '@nestjs/common';
import { EmployeeLedgersService } from './employee-ledgers.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EmployeeLedgerQueryDto } from './dto/employee-ledgers-query.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';

@ApiBearerAuth()
@ApiTags('Employee Ledgers')
@Controller('employee-ledgers')
export class EmployeeLedgersController {
  constructor(private readonly employeeLedgersService: EmployeeLedgersService) { }

  @Get()
  @ApiOperation({ summary: 'Get all employee ledgers' })
  @ApiResponse({ status: 200, description: 'Success' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAll(@Query() queryDto: EmployeeLedgerQueryDto) {
    return this.employeeLedgersService.findAll(queryDto);
  }
}
