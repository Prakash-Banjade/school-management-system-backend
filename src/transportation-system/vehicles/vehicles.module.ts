import { Module } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { StaffsModule } from 'src/staffs/staffs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vehicle,
    ]),
    StaffsModule,
  ],
  controllers: [VehiclesController],
  providers: [VehiclesService],
})
export class VehiclesModule { }
