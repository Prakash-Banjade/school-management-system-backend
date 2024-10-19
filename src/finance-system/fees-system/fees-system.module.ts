import { Module } from '@nestjs/common';
import { FeesGroupsModule } from './fees-groups/fees-groups.module';
import { FeesInvoicesModule } from './fees-invoices/fees-invoices.module';
import { FeesTypesModule } from './fees-types/fees-types.module';

@Module({
    imports: [
        FeesGroupsModule,
        FeesInvoicesModule,
        FeesTypesModule,
    ]
})
export class FeesSystemModule { }
