import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LeaveRequest } from './entities/leave-request.entity';
import { Repository } from 'typeorm';
import { LeaveRequestQueryDto } from './dto/leave-request-query.dto';
import { AuthUser } from 'src/common/types/global.type';
import paginatedData from 'src/utils/paginatedData';
import { AccountsService } from 'src/auth-system/accounts/accounts.service';

@Injectable()
export class LeaveRequestsService {
  constructor(
    @InjectRepository(LeaveRequest) private readonly leaveRequestRepo: Repository<LeaveRequest>,
    private readonly accountsService: AccountsService,
  ) { }

  async create(createLeaveRequestDto: CreateLeaveRequestDto, currentUser: AuthUser) {
    const account = await this.accountsService.findOne(createLeaveRequestDto.accountId || currentUser.accountId);

    const newLeaveRequest = this.leaveRequestRepo.create({
      ...createLeaveRequestDto,
      account
    });

    const savedLevaeRequest = await this.leaveRequestRepo.save(newLeaveRequest);
    return this.leaveRequestMutationReturn(savedLevaeRequest, 'created');
  }

  async findAll(queryDto: LeaveRequestQueryDto, currentUser: AuthUser) {
    const querybuilder = this.leaveRequestRepo.createQueryBuilder('leaveRequest');

    querybuilder
      .orderBy('leaveRequest.createdAt', 'DESC')
      .take(queryDto.take)
      .skip(queryDto.skip)
    // .where({ account: { id: currentUser.accountId } }); 

    return paginatedData(queryDto, querybuilder);
  }

  async findOne(id: string) {
    const existing = await this.leaveRequestRepo.findOne({
      where: { id }
    });
    if (!existing) throw new NotFoundException('Leave request not found');

    return existing;
  }

  async update(id: string, updateLeaveRequestDto: UpdateLeaveRequestDto) {
    const existing = await this.findOne(id);

    Object.assign(existing, updateLeaveRequestDto);
    const savedLeaveRequest = await this.leaveRequestRepo.save(existing);

    return this.leaveRequestMutationReturn(savedLeaveRequest, 'updated');
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    return this.leaveRequestMutationReturn(await this.leaveRequestRepo.remove(existing), 'deleted');
  }

  private leaveRequestMutationReturn = (leaveRequest: LeaveRequest, type: 'created' | 'updated' | 'deleted') => {
    return {
      message: type === 'created' ? 'Leave request created successfully' : 'Leave request updated successfully',
      leaveRequest: {
        id: leaveRequest.id,
        startDate: leaveRequest.leaveFrom,
        endDate: leaveRequest.leaveTo,
      }
    }
  }
}
