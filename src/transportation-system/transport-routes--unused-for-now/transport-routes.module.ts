import { Module } from '@nestjs/common';
import { TransportRoutesService } from './transport-routes.service';
import { TransportRoutesController } from './transport-routes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransportRoute } from './entities/transport-route.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransportRoute,
    ])
  ],
  controllers: [TransportRoutesController],
  providers: [TransportRoutesService],
  exports: [TransportRoutesService],
})
export class TransportRoutesModule { }
