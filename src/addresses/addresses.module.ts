import { Global, Module } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Address]),
  ],
  providers: [AddressesService],
  exports: [AddressesService],
})
export class AddressesModule { }
