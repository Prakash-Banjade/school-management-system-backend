import { Controller } from '@nestjs/common';
import { EmployeeLedgersService } from './employee-ledgers.service';

@Controller('employee-ledgers')
export class EmployeeLedgersController {
  constructor(private readonly employeeLedgersService: EmployeeLedgersService) {}
}
