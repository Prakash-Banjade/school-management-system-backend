import { Controller, Get, Body, Patch, UseInterceptors, Query } from '@nestjs/common';
import { OptionalSubjectService } from './optional-subject.service';
import { AssignOptionalSubjectDto } from './dto/create-optional-subject.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { OptionalSubjectQueryDto } from './dto/optional-subject-query.dto';

@ApiBearerAuth()
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
}
