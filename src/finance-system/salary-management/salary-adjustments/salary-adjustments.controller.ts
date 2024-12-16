import { Controller } from '@nestjs/common';
import { SalaryAdjustmentsService } from './salary-adjustments.service';

@Controller('salary-adjustments')
export class SalaryAdjustmentsController {
  constructor(private readonly salaryAdjustmentsService: SalaryAdjustmentsService) {}
}
