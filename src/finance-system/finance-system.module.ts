import { Module } from '@nestjs/common';
import { FeeManagementModule } from './fee-management/fee-management.module';

@Module({
    imports: [
        FeeManagementModule,
    ]
})
export class FinanceSystemModule { }
