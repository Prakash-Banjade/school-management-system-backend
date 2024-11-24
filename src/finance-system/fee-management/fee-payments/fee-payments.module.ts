import { Module } from '@nestjs/common';
import { FeePaymentsService } from './fee-payments.service';
import { FeePaymentsController } from './fee-payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeePayment } from './entities/fee-payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeePayment,
    ])
  ],
  controllers: [FeePaymentsController],
  providers: [FeePaymentsService],
})
export class FeePaymentsModule { }
