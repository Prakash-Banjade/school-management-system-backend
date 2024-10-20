import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { SubjectsService } from 'src/subjects/subjects.service';
import { AccountsService } from 'src/auth-system/accounts/accounts.service';
import { ImagesService } from 'src/file-management/images/images.service';
import { QueryDto } from 'src/common/dto/query.dto';
import paginatedData from 'src/utils/paginatedData';
import { AuthUser } from 'src/common/types/global.type';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private tasksRepo: Repository<Task>,
    private readonly accountsService: AccountsService,
    private readonly subjectsService: SubjectsService,
    private readonly imagesService: ImagesService,
  ) { }

  async create(createTaskDto: CreateTaskDto, currentAccount: AuthUser) {
    const account = await this.accountsService.findOne(currentAccount.accountId);
    const subject = await this.subjectsService.findOne(createTaskDto.subjectId);
    const attatchments = createTaskDto.attatchmentIds?.length
      ? await this.imagesService.findAllByIds(createTaskDto.attatchmentIds)
      : null;

    const newTask = this.tasksRepo.create({
      ...createTaskDto,
      setBy: account,
      subject,
      attatchments,
    })

    const savedTask = await this.tasksRepo.save(newTask);
    return this.taskMutationReturn(savedTask, 'created');
  }

  async findAll(queryDto: QueryDto) {
    const queryBuilder = this.tasksRepo.createQueryBuilder('task');

    queryBuilder
      .orderBy("task.createdAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .withDeleted()
      .leftJoinAndSelect('task.setBy', 'setBy')
      .leftJoinAndSelect('task.subject', 'subject')
      .leftJoinAndSelect('task.attatchments', 'attatchments')
      .leftJoinAndSelect('subject.classRoom', 'classRoom')
      .andWhere(new Brackets(qb => {
        queryDto.search && qb.andWhere("LOWER(task.title) LIKE LOWER(:search)", { search: `%${queryDto.search}%` })
      }))

    return paginatedData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const existingTask = await this.tasksRepo.findOne({
      where: { id },
      relations: {
        setBy: true,
        subject: true,
        attatchments: true
      }
    });
    if (!existingTask) throw new NotFoundException(`Task with id ${id} not found`);
    return existingTask;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    const existingTask = await this.findOne(id);
    const attatchments = updateTaskDto.attatchmentIds?.length ?
      await this.imagesService.findAllByIds(updateTaskDto.attatchmentIds)
      : existingTask.attatchments;

    existingTask.attatchments = attatchments;

    const updatedTask = this.tasksRepo.merge(existingTask, updateTaskDto);
    return this.taskMutationReturn(await this.tasksRepo.save(updatedTask), 'updated');
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    const removedTask = await this.tasksRepo.remove(existing);

    return this.taskMutationReturn(removedTask, 'deleted');
  }

  private taskMutationReturn = (task: Task, type: 'created' | 'updated' | 'deleted') => {
    return {
      message: type === 'created' ? 'Task created successfully' : 'Task updated successfully',
      task: {
        id: task.id,
        title: task.title,
        description: task.description
      }
    }
  }

}
