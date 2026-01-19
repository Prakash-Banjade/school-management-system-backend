import { Module } from '@nestjs/common';
import { ConversationModule } from './conversation/conversation.module';
import { MessagesModule } from './messages/messages.module';
import { ConversationParticipantsModule } from './conversation-participants/conversation-participants.module';

@Module({
  imports: [ConversationModule, MessagesModule, ConversationParticipantsModule]
})
export class ConversationSystemModule {}
