import { Module } from '@nestjs/common';
import { NoticesService } from './notices.service';
import { NoticesController } from './notices.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notice } from './entities/notice.entity';
import { NoticeHelperService } from './notice-helper.service';
import { Account } from 'src/auth-system/accounts/entities/account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notice,
      Account
    ])
  ],
  controllers: [NoticesController],
  providers: [NoticesService, NoticeHelperService],
})
export class NoticesModule { }
