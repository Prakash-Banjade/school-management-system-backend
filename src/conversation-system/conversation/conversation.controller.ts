import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { QueryDto } from 'src/common/dto/query.dto';

@Controller('conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) { }

  @Get()
  @CheckAbilities(
    { subject: Role.STUDENT, action: Action.READ },
    { subject: Role.TEACHER, action: Action.READ }
  )
  getAll(@Query() queryDto: QueryDto) {
    return this.conversationService.findAll(queryDto);
  }

  @Get(":id")
  @CheckAbilities(
    { subject: Role.STUDENT, action: Action.READ },
    { subject: Role.TEACHER, action: Action.READ }
  )
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.conversationService.findOne(id);
  }
}
