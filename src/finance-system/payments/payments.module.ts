import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { DealersModule } from 'src/dealers/dealers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
    ]),
    DealersModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
