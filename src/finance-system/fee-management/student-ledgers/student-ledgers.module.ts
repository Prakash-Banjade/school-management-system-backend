import { Module } from '@nestjs/common';
import { StudentLedgersService } from './student-ledgers.service';
import { StudentLedgersController } from './student-ledgers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentLedger } from './entities/student-ledger.entity';
import { LedgerItem } from './entities/ledger-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentLedger,
      LedgerItem
    ])
  ],
  controllers: [StudentLedgersController],
  providers: [StudentLedgersService],
})
export class StudentLedgersModule { }
