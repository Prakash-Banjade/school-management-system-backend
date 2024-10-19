import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address) private addressRepository: Repository<Address>,
  ) { }

  async create(createAddressDto: CreateAddressDto) {
    const addressEntity = this.addressRepository.create(createAddressDto);
    return await this.addressRepository.save(addressEntity);
  }

  async update(id: string, udpateAddressDto: UpdateAddressDto) {
    const existingAddress = await this.addressRepository.findOneBy({ id });
    if (!existingAddress) throw new BadRequestException("Address not found");

    Object.assign(existingAddress, udpateAddressDto);

    return await this.addressRepository.save(existingAddress);
  }
}
