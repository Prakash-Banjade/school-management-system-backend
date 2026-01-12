import { Module } from '@nestjs/common';
import { ConversationParticipantsService } from './conversation-participants.service';
import { ConversationParticipantsController } from './conversation-participants.controller';

@Module({
  controllers: [ConversationParticipantsController],
  providers: [ConversationParticipantsService],
})
export class ConversationParticipantsModule {}
