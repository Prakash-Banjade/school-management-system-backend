import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsSelect, Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { AuthUser, Role } from 'src/common/types/global.type';
import { isStudent, } from 'src/utils/utils';
import { ClassRoutine } from 'src/class-routines/entities/class-routine.entity';
import { EConversationType } from './interfaces';
import { Account } from 'src/auth-system/accounts/entities/account.entity';
import { ConversationParticipant } from '../conversation-participants/entities/conversation-participant.entity';
import { QueryDto } from 'src/common/dto/query.dto';
import paginatedData from 'src/utils/paginatedData';
import { applySelectColumns } from 'src/utils/apply-select-cols';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation) private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(ClassRoutine) private readonly classRoutineRepo: Repository<ClassRoutine>,
    @InjectRepository(Account) private readonly accountRepo: Repository<Account>,
    @InjectRepository(ConversationParticipant) private readonly conversationParticipantRepo: Repository<ConversationParticipant>,

  ) { }

  async create(dto: CreateConversationDto, currentUser: AuthUser) {
    if (!isStudent(currentUser)) throw new ForbiddenException('You are not allowed to create a conversation');

    const isValidRoutine = await this.classRoutineRepo.findOne({
      where: {
        classRoom: { id: currentUser.classRoomId },
        teacher: { id: dto.teacherId }
      },
      select: { id: true }
    });
    if (!isValidRoutine) throw new ForbiddenException("You can only chat with your assigned subject teachers.");

    // teacher account
    const teacherAccount = await this.accountRepo.findOne({
      where: {
        role: Role.TEACHER,
        teacher: { id: dto.teacherId }
      },
      select: { id: true }
    });
    if (!teacherAccount) throw new NotFoundException('Teacher not found');

    // check for duplicate
    const existing = await this.conversationRepo
      .createQueryBuilder('conv')
      .where('conv.type = :type', { type: EConversationType.DIRECT })
      .innerJoin('conv.participants', 'p1')
      .innerJoin('conv.participants', 'p2')
      .andWhere('p1.accountId = :studentAccountId', { studentAccountId: currentUser.accountId })
      .andWhere('p2.accountId = :teacherAccountId', { teacherAccountId: teacherAccount.id })
      .getOne();

    if (existing) {
      throw new BadRequestException('A conversation with this teacher already exists');
    }

    const conversation = this.conversationRepo.create({
      type: EConversationType.DIRECT,
      participants: [
        this.conversationParticipantRepo.create({
          account: { id: currentUser.accountId },
        }),
        this.conversationParticipantRepo.create({
          account: { id: teacherAccount.id },
        })
      ]
    })

    await this.conversationRepo.save(conversation);

    return { message: 'Conversation created successfully' }
  }

  findAll(queryDto: QueryDto, currentUser: AuthUser) {
    const queryBuilder = this.conversationRepo.createQueryBuilder('conv')
      .orderBy('conv.lastMessageAt', 'DESC')
      .take(queryDto.take)
      .skip(queryDto.skip)
      // Subquery: Only get conversations where the current user is a participant
      .where(qb => {
        const subQuery = qb
          .subQuery()
          .select('cp.conversationId')
          .from(ConversationParticipant, 'cp')
          .where('cp.accountId = :accountId', { accountId: currentUser.accountId })
          .getQuery();
        return 'conv.id IN ' + subQuery;
      })
      // Now join all participants (for DIRECT, this includes the other participant)
      .leftJoinAndSelect('conv.participants', 'participant')
      .leftJoinAndSelect('participant.account', 'participantAccount')
      .leftJoinAndSelect('participantAccount.profileImage', 'profileImage')
      .select([
        'conv.id',
        'conv.type',
        'conv.title',
        'conv.lastMessageContent',
        'conv.lastMessageAt',
        'participant.id',
        'participant.unreadCount',
        'participantAccount.id',
        'participantAccount.lowerCasedFullName',
        'participantAccount.role',
        'profileImage.id',
        'profileImage.url',
      ])

    return paginatedData(queryDto, queryBuilder);
  }

  async findOne(id: string, currentUser: AuthUser) {
    const queryBuilder = this.conversationRepo.createQueryBuilder('conv')
      .where('conv.id = :id', { id })
      // Subquery: Only get conversations where the current user is a participant
      .andWhere(qb => {
        const subQuery = qb
          .subQuery()
          .select('cp.conversationId')
          .from(ConversationParticipant, 'cp')
          .where('cp.accountId = :accountId', { accountId: currentUser.accountId })
          .getQuery();
        return 'conv.id IN ' + subQuery;
      })
      // Now join all participants (for DIRECT, this includes the other participant)
      .leftJoinAndSelect('conv.participants', 'participant')
      .leftJoinAndSelect('participant.account', 'participantAccount')
      .leftJoinAndSelect('participantAccount.profileImage', 'profileImage')

    queryBuilder.select([
      'conv.id',
      'conv.type',
      'conv.title',
      'conv.lastMessageContent',
      'conv.lastMessageAt',
      'participant.id',
      'participant.unreadCount',
      'participantAccount.id',
      'participantAccount.lowerCasedFullName',
      'participantAccount.role',
      'profileImage.id',
      'profileImage.url',
    ])

    const existing = await queryBuilder.getOne();

    if (!existing) throw new BadRequestException('Conversation not found');
    return existing;
  }

  async markAsRead(conversationId: string, currentUser: AuthUser) {
    await this.conversationParticipantRepo.update(
      { account: { id: currentUser.accountId }, conversation: { id: conversationId } },
      { unreadCount: 0 }
    );
  }

}
