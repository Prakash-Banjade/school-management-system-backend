import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { AuthUser } from 'src/common/types/global.type';
import { isStudent, isTeacher } from 'src/utils/utils';
import { QueryDto } from 'src/common/dto/query.dto';
import { Message } from '../messages/entities/message.entity';
import { paginatedRawData } from 'src/utils/paginatedData';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>
  ) { }

  async create(dto: CreateConversationDto, currentUser: AuthUser) {
    if (isStudent(currentUser) && !dto.teacherId) throw new BadRequestException('Teacher id is required');
    if (isTeacher(currentUser) && !dto.studentId) throw new BadRequestException('Student id is required');

    const duplicateConversation = await this.conversationRepo.findOneBy({
      teacher: { id: isStudent(currentUser) ? dto.teacherId : dto.studentId },
      student: { id: isTeacher(currentUser) ? dto.studentId : dto.teacherId }
    })
    if (duplicateConversation) throw new BadRequestException('Conversation already exists');

    const conversation = this.conversationRepo.create({
      teacher: { id: isStudent(currentUser) ? dto.teacherId : dto.studentId },
      student: { id: isTeacher(currentUser) ? dto.studentId : dto.teacherId }
    })

    await this.conversationRepo.save(conversation);

    return { message: 'Conversation created successfully' }
  }

  findAll(queryDto: QueryDto) {
    const queryBuilder = this.conversationRepo.createQueryBuilder("conv")
      .limit(queryDto.take)
      .offset(queryDto.skip)
      // subquery gets latest message per conv
      .leftJoin(
        qb => {
          return qb
            .subQuery()
            .select("msg.conversationId", "conversationid")     // lowercase
            .addSelect("msg.createdAt", "latestcreatedat")    // lowercase
            .addSelect("msg.seenAt", "latestseenat")    // lowercase
            .addSelect("msg.senderId", "latestmessagesenderid")    // lowercase
            .from(Message, "msg")
            .where(qb2 => {
              const sub = qb2
                .subQuery()
                .select("MAX(inner.createdAt)")
                .from(Message, "inner")
                .where("inner.conversationId = msg.conversationId")
                .getQuery();
              return "msg.createdAt = " + sub;
            });
        },
        "lm", // alias of the derived table
        "lm.conversationid = conv.id"  // must match alias casing
      )
      .leftJoin("conv.account", "account")
      .leftJoin("account.organization", "organization")
      .select([
        'conv.id as id',
        'account.id as "senderId"',
        'account.firstName as senderFirstName',
        'account.lastName as senderLastName',
        'account.role as "senderRole"',
        // 'lm.latestcreatedat as "latestMessageCreatedAt"',
        // 'lm.latestseenat as "latestMessageSeenAt"',
        // 'lm.latestmessagesenderid as "latestMessageSenderId"',
      ])
      .orderBy("lm.latestcreatedat", "DESC")

    return paginatedRawData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const existing = await this.conversationRepo.findOne({
      where: { id },
      relations: ['teacher', 'student'],
      select: {
        id: true,
        teacher: {
          id: true,
          firstName: true,
          lastName: true,
        },
        student: {
          id: true,
          firstName: true,
          lastName: true,
        }
      }
    });
    if (!existing) throw new BadRequestException('Conversation not found');
    return existing;
  }
}
