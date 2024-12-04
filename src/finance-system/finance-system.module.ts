import { Module } from '@nestjs/common';
import { FeeManagementModule } from './fee-management/fee-management.module';
import { SalaryManagementModule } from './salary-management/salary-management.module';

@Module({
    imports: [
        FeeManagementModule,
        SalaryManagementModule,
    ]
})
export class FinanceSystemModule { }
