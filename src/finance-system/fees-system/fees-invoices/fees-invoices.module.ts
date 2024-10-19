import { Module } from '@nestjs/common';
import { FeesInvoicesService } from './fees-invoices.service';
import { FeesInvoicesController } from './fees-invoices.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeesInvoice } from './entities/fees-invoice.entity';
import { FeeItem } from './entities/fee-item.entity';
import { StudentsModule } from 'src/students/students.module';
import { FeesGroupsModule } from '../fees-groups/fees-groups.module';
import { FeeItemsService } from './fee-items.service';
import { FeesType } from '../fees-types/entities/fees-type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeesInvoice,
      FeeItem,
      FeesType,
    ]),
    StudentsModule,
  ],
  controllers: [FeesInvoicesController],
  providers: [FeesInvoicesService, FeeItemsService],
})
export class FeesInvoicesModule { }
