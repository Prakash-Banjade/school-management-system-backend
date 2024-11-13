import { Injectable } from '@nestjs/common';
import { CreateStudentOptionalSubjectDto } from './dto/create-student-optional-subject.dto';
import { UpdateStudentOptionalSubjectDto } from './dto/update-student-optional-subject.dto';

@Injectable()
export class StudentOptionalSubjectService {
  create(createStudentOptionalSubjectDto: CreateStudentOptionalSubjectDto) {
    return 'This action adds a new studentOptionalSubject';
  }

  findAll() {
    return `This action returns all studentOptionalSubject`;
  }

  findOne(id: number) {
    return `This action returns a #${id} studentOptionalSubject`;
  }

  update(id: number, updateStudentOptionalSubjectDto: UpdateStudentOptionalSubjectDto) {
    return `This action updates a #${id} studentOptionalSubject`;
  }

  remove(id: number) {
    return `This action removes a #${id} studentOptionalSubject`;
  }
}
