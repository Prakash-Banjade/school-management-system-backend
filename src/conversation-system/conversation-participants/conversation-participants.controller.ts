import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ConversationParticipantsService } from './conversation-participants.service';
import { CreateConversationParticipantDto } from './dto/create-conversation-participant.dto';
import { UpdateConversationParticipantDto } from './dto/update-conversation-participant.dto';

@Controller('conversation-participants')
export class ConversationParticipantsController {
  constructor(private readonly conversationParticipantsService: ConversationParticipantsService) {}

  @Post()
  create(@Body() createConversationParticipantDto: CreateConversationParticipantDto) {
    return this.conversationParticipantsService.create(createConversationParticipantDto);
  }

  @Get()
  findAll() {
    return this.conversationParticipantsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.conversationParticipantsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateConversationParticipantDto: UpdateConversationParticipantDto) {
    return this.conversationParticipantsService.update(+id, updateConversationParticipantDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.conversationParticipantsService.remove(+id);
  }
}
