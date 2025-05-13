import { Module } from '@nestjs/common';
import { LeaveRequestsService } from './leave-requests.service';
import { LeaveRequestsController } from './leave-requests.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveRequest } from './entities/leave-request.entity';
import { LeaveRequestsCron } from './leave-requests.cron';
import { Account } from 'src/auth-system/accounts/entities/account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LeaveRequest,
      Account,
    ]),
  ],
  controllers: [LeaveRequestsController],
  providers: [LeaveRequestsService, LeaveRequestsCron],
})
export class LeaveRequestsModule { }
