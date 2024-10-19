import { Module } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { Purchase } from './entities/purchase.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DealersModule } from 'src/dealers/dealers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Purchase,
    ]),
    DealersModule,
  ],
  controllers: [PurchasesController],
  providers: [PurchasesService],
})
export class PurchasesModule { }
