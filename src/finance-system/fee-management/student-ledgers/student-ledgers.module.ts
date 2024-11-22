import { Module } from '@nestjs/common';
import { StudentLedgersService } from './student-ledgers.service';
import { StudentLedgersController } from './student-ledgers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentLedger } from './entities/student-ledger.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentLedger
    ])
  ],
  controllers: [StudentLedgersController],
  providers: [StudentLedgersService],
})
export class StudentLedgersModule { }
