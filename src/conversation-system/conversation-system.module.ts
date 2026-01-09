import { Module } from '@nestjs/common';
import { ConversationModule } from './conversation/conversation.module';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [ConversationModule, MessagesModule]
})
export class ConversationSystemModule {}
