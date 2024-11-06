import { Module } from '@nestjs/common';
import { VehiclesModule } from './vehicles/vehicles.module';
import { RouteStopsModule } from './route-stops/route-stops.module';

@Module({
    imports: [
        VehiclesModule,
        RouteStopsModule,
    ],
})
export class TransportationSystemModule {}
