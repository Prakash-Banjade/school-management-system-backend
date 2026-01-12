import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { QueryDto } from 'src/common/dto/query.dto';
import { AuthUser } from 'src/common/types/global.type';
import { Message } from './entities/message.entity';
import { DataSource, Not } from 'typeorm';
import paginatedData from 'src/utils/paginatedData';
import { ConversationService } from '../conversation/conversation.service';
import { ConversationParticipant } from '../conversation-participants/entities/conversation-participant.entity';
import { BaseRepository } from 'src/common/repository/base-repository';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { Conversation } from '../conversation/entities/conversation.entity';

@Injectable()
export class MessagesService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly conversationService: ConversationService
  ) { super(dataSource, req) }

  async create(dto: CreateMessageDto, currentUser: AuthUser) {
    const conversation = await this.conversationService.findOne(dto.conversationId, currentUser);

    const message = this.getRepository(Message).create({
      content: dto.content,
      conversation,
      sender: { id: currentUser.accountId }
    });

    // 1. save message
    await this.getRepository(Message).save(message);

    // 2. increment unread count for other participants
    await this.getRepository(ConversationParticipant).increment(
      {
        conversation: { id: conversation.id },
        account: { id: Not(currentUser.accountId) } // Don't increment for self
      },
      'unreadCount',
      1
    );

    // 3. update conversation
    await this.getRepository(Conversation).update(
      conversation.id,
      {
        lastMessageContent: dto.content,
        lastMessageAt: new Date()
      }
    );

    return message;
  }

  findAll(conversationId: string, queryDto: QueryDto, currentUser: AuthUser) {
    const queryBuilder = this.getRepository(Message).createQueryBuilder('message')
      .orderBy('message.createdAt', 'DESC')
      .take(queryDto.take)
      .skip(queryDto.skip)
      .innerJoin('message.conversation', 'conversation', 'conversation.id = :conversationId', { conversationId })
      .innerJoin('conversation.participants', 'participant', 'participant.accountId = :accountId', { accountId: currentUser.accountId })
      .leftJoin('message.sender', 'sender')
      .select([
        'message.id',
        'message.content',
        'message.createdAt',
        'sender.id',
        'sender.lowerCasedFullName',
        'sender.role',
        'participant.id',
        'participant.unreadCount',
      ])

    return paginatedData(queryDto, queryBuilder);
  }

}
