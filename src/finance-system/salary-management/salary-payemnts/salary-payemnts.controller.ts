import { Controller } from '@nestjs/common';
import { SalaryPayemntsService } from './salary-payemnts.service';

@Controller('salary-payemnts')
export class SalaryPayemntsController {
  constructor(private readonly salaryPayemntsService: SalaryPayemntsService) {}
}
