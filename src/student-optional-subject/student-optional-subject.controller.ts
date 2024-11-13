import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { StudentOptionalSubjectService } from './student-optional-subject.service';
import { CreateStudentOptionalSubjectDto } from './dto/create-student-optional-subject.dto';
import { UpdateStudentOptionalSubjectDto } from './dto/update-student-optional-subject.dto';

@Controller('student-optional-subject')
export class StudentOptionalSubjectController {
  constructor(private readonly studentOptionalSubjectService: StudentOptionalSubjectService) {}

  @Post()
  create(@Body() createStudentOptionalSubjectDto: CreateStudentOptionalSubjectDto) {
    return this.studentOptionalSubjectService.create(createStudentOptionalSubjectDto);
  }

  @Get()
  findAll() {
    return this.studentOptionalSubjectService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentOptionalSubjectService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentOptionalSubjectDto: UpdateStudentOptionalSubjectDto) {
    return this.studentOptionalSubjectService.update(+id, updateStudentOptionalSubjectDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentOptionalSubjectService.remove(+id);
  }
}
