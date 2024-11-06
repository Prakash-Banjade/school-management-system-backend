import { Module } from '@nestjs/common';
import { RouteStopsService } from './route-stops.service';
import { RouteStopsController } from './route-stops.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouteStop } from './entities/route-stop.entity';
import { VehiclesModule } from '../vehicles/vehicles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RouteStop,
    ]),
    VehiclesModule,
  ],
  controllers: [RouteStopsController],
  providers: [RouteStopsService],
})
export class RouteStopsModule {}
