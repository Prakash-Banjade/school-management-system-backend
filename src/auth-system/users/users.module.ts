import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ImagesModule } from 'src/file-management/images/images.module';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [
    ImagesModule,
    AccountsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
