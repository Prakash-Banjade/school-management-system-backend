import { Module } from '@nestjs/common';
import { VehiclesModule } from './vehicles/vehicles.module';
import { TransportRoutesModule } from './transport-routes/transport-routes.module';

@Module({
    imports: [
        VehiclesModule,
        TransportRoutesModule,
    ],
})
export class TransportationSystemModule {}
