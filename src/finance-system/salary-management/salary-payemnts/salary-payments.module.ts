import { Module } from '@nestjs/common';
import { SalaryPaymentsService } from './salary-payments.service';
import { SalaryPaymentsController } from './salary-payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryPayment } from './entities/salary-payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalaryPayment,
    ])
  ],
  controllers: [SalaryPaymentsController],
  providers: [SalaryPaymentsService],
})
export class SalaryPaymentsModule { }
