import { PartialType } from '@nestjs/swagger';
import { CreateConversationParticipantDto } from './create-conversation-participant.dto';

export class UpdateConversationParticipantDto extends PartialType(CreateConversationParticipantDto) {}
