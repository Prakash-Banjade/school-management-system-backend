import { Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { ClassRoutine } from 'src/class-routines/entities/class-routine.entity';
import { Account } from 'src/auth-system/accounts/entities/account.entity';
import { ConversationParticipant } from '../conversation-participants/entities/conversation-participant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Conversation,
      ClassRoutine,
      Account,
      ConversationParticipant
    ])
  ],
  controllers: [ConversationController],
  providers: [ConversationService],
  exports: [ConversationService],
})
export class ConversationModule { }
