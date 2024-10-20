import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Salary } from './entities/salary.entity';
import { Brackets, Repository } from 'typeorm';
import { SalaryQueryDto } from './dto/salary-query.dto';
import paginatedData from 'src/utils/paginatedData';
import { AccountsService } from 'src/auth-system/accounts/accounts.service';

@Injectable()
export class SalariesService {
  constructor(
    @InjectRepository(Salary) private salaryRepo: Repository<Salary>,
    private readonly accountsService: AccountsService,
  ) { }

  // TODO: USE CRON JOBS TO RUN THIS FUNCTION ON EVERY MONTH
  async create(createSalaryDto: CreateSalaryDto) {
    const account = await this.accountsService.findOne(createSalaryDto.accountId);

    const salary = this.salaryRepo.create({
      ...createSalaryDto,
      account,
      // TODO: Observe why I used user.wage, for now only createSalaryDto.wage is used
      // wage: createSalaryDto.wage || user.wage,
      wage: createSalaryDto.wage,
    });

    const savedSalary = await this.salaryRepo.save(salary);

    return this.salaryMutationReturn(savedSalary, 'created');
  }

  async findAll(queryDto: SalaryQueryDto) {
    const querybuilder = this.salaryRepo.createQueryBuilder('salary');

    querybuilder
      .orderBy('salary.createdAt', 'DESC')
      .skip(queryDto.skip)
      .take(queryDto.take)
      .leftJoinAndSelect('salary.user', 'user')
      .where(new Brackets(qb => {
        queryDto.status && qb.andWhere('salary.status = :status', { status: queryDto.status });
      }))

    return paginatedData(queryDto, querybuilder);
  }

  async findOne(id: string) {
    const existing = await this.salaryRepo.findOne({
      where: { id },
    })

    if (!existing) throw new NotFoundException('Salary not found');

    return existing
  }

  async update(id: string, updateSalaryDto: UpdateSalaryDto) {
    const existing = await this.findOne(id);

    Object.assign(existing, updateSalaryDto);
    const updatedSalary = await this.salaryRepo.save(existing);
    return this.salaryMutationReturn(updatedSalary, 'updated');
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    await this.salaryRepo.remove(existing);
    return this.salaryMutationReturn(existing, 'deleted');
  }

  private salaryMutationReturn = (salary: Salary, type: 'created' | 'updated' | 'deleted') => {
    return {
      message: type === 'created' ? 'Salary created successfully' : 'Salary updated successfully',
      salary: {
        id: salary.id,
        wage: salary.wage,
        bonus: salary.bonus,
        deduction: salary.deduction,
      }
    }
  }
}
