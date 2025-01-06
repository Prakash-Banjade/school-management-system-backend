import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { AuthModule } from '../auth/auth.module';
import { AccountsController } from './accounts.controller';
import { AccountsCronJob } from './accounts.cron';
import { LoginDevice } from './entities/login-devices.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      LoginDevice,
    ]),
    AuthModule,
  ],
  controllers: [AccountsController],
  providers: [AccountsService, AccountsCronJob],
  exports: [AccountsService],
})
export class AccountsModule { }
