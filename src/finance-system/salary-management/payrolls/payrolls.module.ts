import { Module } from '@nestjs/common';
import { PayrollsService } from './payrolls.service';
import { PayrollsController } from './payrolls.controller';
import { PayrollsHelper } from './helpers/payrolls.helper';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payroll } from './entities/payroll.entity';
import { SalaryStructure } from '../salary-structures/entities/salary-structure.entity';
import { AttendancesModule } from 'src/attendances/attendances.module';
import { BookTransactionsModule } from 'src/library-system/book-transactions/book-transactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payroll,
      SalaryStructure,
    ]),
    AttendancesModule,
    BookTransactionsModule,
  ],
  controllers: [PayrollsController],
  providers: [
    PayrollsService,
    PayrollsHelper,
  ],
})
export class PayrollsModule { }
