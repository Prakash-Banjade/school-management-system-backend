import { Module } from '@nestjs/common';
import { SalaryStructuresModule } from './salary-structures/salary-structures.module';
import { SalaryAdjustmentsModule } from './salary-adjustments/salary-adjustments.module';
import { PayrollsModule } from './payrolls/payrolls.module';
import { SalaryPayemntsModule } from './salary-payemnts/salary-payemnts.module';
import { EmployeeLedgersModule } from './employee-ledgers/employee-ledgers.module';

@Module({
  imports: [SalaryStructuresModule, SalaryAdjustmentsModule, PayrollsModule, SalaryPayemntsModule, EmployeeLedgersModule],
})
export class SalaryManagementModule { }
