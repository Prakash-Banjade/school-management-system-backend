import { Module } from '@nestjs/common';
import { ChargeHeadsModule } from './charge-heads/charge-heads.module';
import { FeeStructuresModule } from './fee-structures/fee-structures.module';
import { FeeInvoiceModule } from './fee-invoice/fee-invoice.module';
import { StudentLedgersModule } from './student-ledgers/student-ledgers.module';

@Module({
  imports: [ChargeHeadsModule, FeeStructuresModule, FeeInvoiceModule, StudentLedgersModule]
})
export class FeeManagementModule {}
