import { Controller, Post, Body, Get, Query, Param, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { QueryDto } from 'src/common/dto/query.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Conversations')
@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) { }

  @Post()
  @CheckAbilities({ subject: Role.STUDENT, action: Action.CREATE })
  create(@Body() dto: CreateConversationDto, @CurrentUser() currentUser: AuthUser) {
    return this.conversationService.create(dto, currentUser);
  }

  @Get()
  @CheckAbilities(
    { subject: Role.STUDENT, action: Action.READ },
    { subject: Role.TEACHER, action: Action.READ }
  )
  getAll(@Query() queryDto: QueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.conversationService.findAll(queryDto, currentUser);
  }

  @Get(":id")
  @CheckAbilities(
    { subject: Role.STUDENT, action: Action.READ },
    { subject: Role.TEACHER, action: Action.READ }
  )
  findOne(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() currentUser: AuthUser) {
    return this.conversationService.findOne(id, currentUser);
  }

  @Post(":id/mark-as-read")
  @HttpCode(HttpStatus.NO_CONTENT)
  @CheckAbilities(
    { subject: Role.STUDENT, action: Action.UPDATE },
    { subject: Role.TEACHER, action: Action.UPDATE }
  )
  markAsRead(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() currentUser: AuthUser) {
    return this.conversationService.markAsRead(id, currentUser);
  }
}
