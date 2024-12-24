import { Controller, Get, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ExamSubjectsService } from './exam-subjects.service';
import { UpdateExamSubjectDto } from './dto/update-exam-subject.dto';
import { ExamSubjectQueryDto } from './dto/exam-subject-query.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { isStudent } from 'src/utils/utils';

@ApiBearerAuth()
@ApiTags('Exam Subjects')
@Controller('exam-subjects')
export class ExamSubjectsController {
  constructor(private readonly examSubjectsService: ExamSubjectsService) { }

  @Get()
  @CheckAbilities(
    { action: Action.READ, subject: Role.ADMIN },
    { action: Action.READ, subject: Role.STUDENT }
  )
  findAll(@Query() queryDto: ExamSubjectQueryDto, @CurrentUser() currentUser: AuthUser) {
    if (isStudent(currentUser)) queryDto.classRoomId = currentUser.classRoomId;
    return this.examSubjectsService.findAll(queryDto);
  }

  @Get('options')
  @CheckAbilities({ action: Action.READ, subject: Role.ADMIN })
  getOptions(@Query() queryDto: ExamSubjectQueryDto) {
    return this.examSubjectsService.findAll({ ...queryDto, asOptions: true } as ExamSubjectQueryDto);
  }

  @Get(':id')
  @CheckAbilities({ action: Action.READ, subject: Role.ADMIN })
  findOne(@Param('id') id: string) {
    return this.examSubjectsService.findOne(id);
  }

  @Patch(':id')
  @CheckAbilities({ action: Action.UPDATE, subject: Role.ADMIN })
  update(@Param('id') id: string, @Body() updateExamSubjectDto: UpdateExamSubjectDto) {
    return this.examSubjectsService.update(id, updateExamSubjectDto);
  }

  @Delete(':id')
  @CheckAbilities({ action: Action.DELETE, subject: Role.ADMIN })
  remove(@Param('id') id: string) {
    return this.examSubjectsService.remove(id);
  }
}
