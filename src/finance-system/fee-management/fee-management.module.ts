import { Module } from '@nestjs/common';
import { ChargeHeadsModule } from './charge-heads/charge-heads.module';

@Module({
  imports: [ChargeHeadsModule]
})
export class FeeManagementModule {}
