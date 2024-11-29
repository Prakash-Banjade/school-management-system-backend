import { Module } from '@nestjs/common';
import { FeeInvoiceService } from './fee-invoice.service';
import { FeeInvoiceController } from './fee-invoice.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeInvoice } from './entities/fee-invoice.entity';
import { FeeInvoiceItem } from './entities/fee-invoice-item.entity';
import { FeeInvoiceMailer } from './fee-invoice.mailer';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeeInvoice,
      FeeInvoiceItem,
    ])
  ],
  controllers: [FeeInvoiceController],
  providers: [
    FeeInvoiceService,
    FeeInvoiceMailer
  ],
  exports: [FeeInvoiceService],
})
export class FeeInvoiceModule { }
