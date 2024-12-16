import { Module } from '@nestjs/common';
import { PayrollsService } from './payrolls.service';
import { PayrollsController } from './payrolls.controller';
import { PayrollsHelper } from './helpers/payrolls.helper';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payroll } from './entities/payroll.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payroll,
    ])
  ],
  controllers: [PayrollsController],
  providers: [
    PayrollsService,
    PayrollsHelper,
  ],
})
export class PayrollsModule { }
