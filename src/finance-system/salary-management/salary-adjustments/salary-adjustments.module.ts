import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryAdjustment } from './entities/salary-adjustment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalaryAdjustment
    ])
  ],
})
export class SalaryAdjustmentsModule { }
