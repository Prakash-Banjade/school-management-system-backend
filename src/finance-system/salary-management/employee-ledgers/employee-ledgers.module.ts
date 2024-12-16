import { Module } from '@nestjs/common';
import { EmployeeLedgersService } from './employee-ledgers.service';
import { EmployeeLedgersController } from './employee-ledgers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeLedger } from './entities/employee-ledger.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmployeeLedger
    ])
  ],
  controllers: [EmployeeLedgersController],
  providers: [EmployeeLedgersService],
})
export class EmployeeLedgersModule { }
