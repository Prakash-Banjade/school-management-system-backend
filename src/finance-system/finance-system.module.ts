import { Module } from '@nestjs/common';
import { SalariesModule } from './salaries/salaries.module';
import { PurchasesModule } from './purchases/purchases.module';
import { PaymentsModule } from './payments/payments.module';
import { FeesTypesModule } from './fees-system/fees-types/fees-types.module';
import { FeesSystemModule } from './fees-system/fees-system.module';

@Module({
    imports: [
        SalariesModule,
        PurchasesModule,
        PaymentsModule,
        FeesSystemModule,
    ]
})
export class FinanceSystemModule { }
