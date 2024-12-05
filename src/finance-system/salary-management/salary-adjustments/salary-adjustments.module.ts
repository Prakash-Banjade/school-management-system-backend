import { Module } from '@nestjs/common';
import { SalaryAdjustmentsService } from './salary-adjustments.service';
import { SalaryAdjustmentsController } from './salary-adjustments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryAdjustment } from './entities/salary-adjustment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalaryAdjustment
    ])
  ],
  controllers: [SalaryAdjustmentsController],
  providers: [SalaryAdjustmentsService],
})
export class SalaryAdjustmentsModule { }
