import { Module } from '@nestjs/common';
import { PurchasesModule } from './purchases/purchases.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
    imports: [
        PurchasesModule,
        PaymentsModule,
    ]
})
export class FinanceSystemModule { }
