import { Module } from '@nestjs/common';
import { PayrollsService } from './payrolls.service';
import { PayrollsController } from './payrolls.controller';
import { PayrollsHelper } from './helpers/payrolls.helper';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payroll } from './entities/payroll.entity';
import { SalaryStructure } from '../salary-structures/entities/salary-structure.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payroll,
      SalaryStructure,
    ])
  ],
  controllers: [PayrollsController],
  providers: [
    PayrollsService,
    PayrollsHelper,
  ],
})
export class PayrollsModule { }
