import { Module } from '@nestjs/common';
import { SalaryPayemntsService } from './salary-payemnts.service';
import { SalaryPayemntsController } from './salary-payemnts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryPayment } from './entities/salary-payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalaryPayment,
    ])
  ],
  controllers: [SalaryPayemntsController],
  providers: [SalaryPayemntsService],
})
export class SalaryPayemntsModule { }
