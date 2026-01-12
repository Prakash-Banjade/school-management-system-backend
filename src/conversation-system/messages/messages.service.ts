import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { QueryDto } from 'src/common/dto/query.dto';
import { AuthUser } from 'src/common/types/global.type';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { Not, Repository } from 'typeorm';
import paginatedData from 'src/utils/paginatedData';
import { ConversationService } from '../conversation/conversation.service';
import { ConversationParticipant } from '../conversation-participants/entities/conversation-participant.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message) private readonly messageRepo: Repository<Message>,
    @InjectRepository(ConversationParticipant) private readonly participantRepo: Repository<ConversationParticipant>,
    private readonly conversationService: ConversationService
  ) { }

  async create(dto: CreateMessageDto, currentUser: AuthUser) {
    const conversation = await this.conversationService.findOne(dto.conversationId, currentUser);

    const message = this.messageRepo.create({
      content: dto.content,
      conversation,
      sender: { id: currentUser.accountId }
    });

    await this.participantRepo.increment(
      {
        conversation: { id: conversation.id },
        account: { id: Not(currentUser.accountId) } // Don't increment for self
      },
      'unreadCount',
      1
    );

    await this.messageRepo.save(message);

    return message;
  }

  findAll(conversationId: string, queryDto: QueryDto, currentUser: AuthUser) {
    const queryBuilder = this.messageRepo.createQueryBuilder('message')
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
