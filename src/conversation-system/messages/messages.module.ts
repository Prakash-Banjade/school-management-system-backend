import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { ConversationModule } from '../conversation/conversation.module';
import { ConversationParticipant } from '../conversation-participants/entities/conversation-participant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Message,
      ConversationParticipant
    ]),
    ConversationModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule { }
