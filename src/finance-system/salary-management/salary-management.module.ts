import { Module } from '@nestjs/common';
import { SalaryStructuresModule } from './salary-structures/salary-structures.module';
import { SalaryAdjustmentsModule } from './salary-adjustments/salary-adjustments.module';
import { PayrollsModule } from './payrolls/payrolls.module';
import { EmployeeLedgersModule } from './employee-ledgers/employee-ledgers.module';
import { SalaryPaymentsModule } from './salary-payemnts/salary-payments.module';

@Module({
  imports: [SalaryStructuresModule, SalaryAdjustmentsModule, PayrollsModule, SalaryPaymentsModule, EmployeeLedgersModule],
})
export class SalaryManagementModule { }
