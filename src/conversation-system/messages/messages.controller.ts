import { Controller, Get, Post, Body, Query, Param, ParseUUIDPipe, UseInterceptors } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { QueryDto } from 'src/common/dto/query.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';

@ApiBearerAuth()
@ApiTags('Messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

  @Post()
  @CheckAbilities(
    { subject: Role.STUDENT, action: Action.CREATE },
    { subject: Role.TEACHER, action: Action.CREATE }
  )
  @UseInterceptors(TransactionInterceptor)
  create(@Body() createMessageDto: CreateMessageDto, @CurrentUser() currentUser: AuthUser) {
    return this.messagesService.create(createMessageDto, currentUser);
  }

  @Get(":conversationId")
  @CheckAbilities(
    { subject: Role.STUDENT, action: Action.READ },
    { subject: Role.TEACHER, action: Action.READ }
  )
  findAll(@Param("conversationId", ParseUUIDPipe) conversationId: string, @Query() queryDto: QueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.messagesService.findAll(conversationId, queryDto, currentUser);
  }

}
