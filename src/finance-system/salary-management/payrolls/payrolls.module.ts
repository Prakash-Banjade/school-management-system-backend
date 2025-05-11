import { Module } from '@nestjs/common';
import { PayrollsService } from './payrolls.service';
import { PayrollsController } from './payrolls.controller';
import { PayrollsHelper } from './helpers/payrolls.helper';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payroll } from './entities/payroll.entity';
import { SalaryStructure } from '../salary-structures/entities/salary-structure.entity';
import { AttendancesModule } from 'src/attendances/attendances.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payroll,
      SalaryStructure,
    ]),
    AttendancesModule,
  ],
  controllers: [PayrollsController],
  providers: [
    PayrollsService,
    PayrollsHelper,
  ],
})
export class PayrollsModule { }
