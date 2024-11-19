import { Module } from '@nestjs/common';
import { ChargeHeadsService } from './charge-heads.service';
import { ChargeHeadsController } from './charge-heads.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChargeHead } from './entities/charge-head.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChargeHead
    ])
  ],
  controllers: [ChargeHeadsController],
  providers: [ChargeHeadsService],
})
export class ChargeHeadsModule {}
