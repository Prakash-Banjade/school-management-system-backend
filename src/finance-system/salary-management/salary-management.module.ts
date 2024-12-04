import { Module } from '@nestjs/common';
import { SalaryStructuresModule } from './salary-structures/salary-structures.module';

@Module({
  imports: [SalaryStructuresModule],
})
export class SalaryManagementModule { }
