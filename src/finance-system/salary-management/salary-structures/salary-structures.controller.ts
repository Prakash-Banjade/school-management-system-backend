import { Controller } from '@nestjs/common';
import { SalaryStructuresService } from './salary-structures.service';

@Controller('salary-structures')
export class SalaryStructuresController {
  constructor(private readonly salaryStructuresService: SalaryStructuresService) {}
}
