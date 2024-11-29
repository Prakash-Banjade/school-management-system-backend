import { Module } from '@nestjs/common';
import { FeePaymentsService } from './fee-payments.service';
import { FeePaymentsController } from './fee-payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeePayment } from './entities/fee-payment.entity';
import { BookTransactionsModule } from 'src/library-system/book-transactions/book-transactions.module';
import { FeeInvoiceModule } from '../fee-invoice/fee-invoice.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeePayment,
    ]),
    BookTransactionsModule,
    FeeInvoiceModule
  ],
  controllers: [FeePaymentsController],
  providers: [FeePaymentsService],
})
export class FeePaymentsModule { }
