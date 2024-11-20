import { Module } from '@nestjs/common';
import { ChargeHeadsModule } from './charge-heads/charge-heads.module';
import { FeeStructuresModule } from './fee-structures/fee-structures.module';

@Module({
  imports: [ChargeHeadsModule, FeeStructuresModule]
})
export class FeeManagementModule {}
