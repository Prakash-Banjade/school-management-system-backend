import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LeaveRequest } from './entities/leave-request.entity';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { AuthUser, Roles } from 'src/core/types/global.types';
import { LeaveRequestQueryDto } from './dto/leave-request-query.dto';
import paginatedData from 'src/core/utils/paginatedData';

@Injectable()
export class LeaveRequestsService {
  constructor(
    @InjectRepository(LeaveRequest) private readonly leaveRequestRepo: Repository<LeaveRequest>,
    private readonly usersService: UsersService,
  ) { }

  async create(createLeaveRequestDto: CreateLeaveRequestDto, currentUser: AuthUser) {
    const user = await this.usersService.findOne(createLeaveRequestDto.userId || currentUser.userId);

    const newLeaveRequest = this.leaveRequestRepo.create({
      ...createLeaveRequestDto,
      user
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
    // .where({ user: { id: currentUser.userId } });

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
