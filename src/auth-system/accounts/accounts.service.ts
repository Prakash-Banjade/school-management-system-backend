import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account) private accountsRepo: Repository<Account>,
  ) { }

  async findOne(id: string) {
    const existingAccount = await this.accountsRepo.findOneBy({ id });
    if (!existingAccount) throw new NotFoundException('Account not found');

    return existingAccount;
  }
}
