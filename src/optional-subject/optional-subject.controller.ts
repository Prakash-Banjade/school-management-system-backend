import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, Query } from '@nestjs/common';
import { OptionalSubjectService } from './optional-subject.service';
import { AssignOptionalSubjectDto } from './dto/create-optional-subject.dto';
import { ApiTags } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { OptionalSubjectQueryDto } from './dto/optional-subject-query.dto';

@ApiTags('Optional Subjects')
@Controller('optional-subjects')
export class OptionalSubjectController {
  constructor(private readonly optionalSubjectService: OptionalSubjectService) { }

  @Patch()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  @UseInterceptors(TransactionInterceptor)
  assignSubjects(@Body() body: AssignOptionalSubjectDto) {
    return this.optionalSubjectService.assignSubjects(body);
  }

  @Get()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAll(@Query() queryDto: OptionalSubjectQueryDto) {
    return this.optionalSubjectService.findAll(queryDto);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.optionalSubjectService.findOne(+id);
  }

  @Delete(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.DELETE })
  remove(@Param('id') id: string) {
    return this.optionalSubjectService.remove(+id);
  }
}
