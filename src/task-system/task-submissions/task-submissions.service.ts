import { Injectable } from '@nestjs/common';
import { CreateTaskSubmissionDto } from './dto/create-task-submission.dto';
import { UpdateTaskSubmissionDto } from './dto/update-task-submission.dto';

@Injectable()
export class TaskSubmissionsService {
  create(createTaskSubmissionDto: CreateTaskSubmissionDto) {
    return 'This action adds a new taskSubmission';
  }

  findAll() {
    return `This action returns all taskSubmissions`;
  }

  findOne(id: string) {
    return `This action returns a #${id} taskSubmission`;
  }

  update(id: string, updateTaskSubmissionDto: UpdateTaskSubmissionDto) {
    return `This action updates a #${id} taskSubmission`;
  }

  remove(id: string) {
    return `This action removes a #${id} taskSubmission`;
  }
}
