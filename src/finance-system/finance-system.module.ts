import { Module } from '@nestjs/common';
import { PurchasesModule } from './purchases/purchases.module';
import { PaymentsModule } from './payments/payments.module';
import { FeeManagementModule } from './fee-management/fee-management.module';

@Module({
    imports: [
        PurchasesModule,
        PaymentsModule,
        FeeManagementModule,
    ]
})
export class FinanceSystemModule { }
