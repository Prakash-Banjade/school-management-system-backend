import { Controller, Get, Param, Query } from '@nestjs/common';
import { ExamResultsService } from './exam-results.service';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ExamResultQueryDto } from './dto/exam-result-query.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';

@ApiBearerAuth()
@ApiTags('Exam Results')
@Controller('exam-results')
export class ExamResultsController {
  constructor(private readonly examResultsService: ExamResultsService) { }

  @Get()
  @ApiOperation({ summary: 'Get all exam results' })
  @ApiOkResponse({ description: 'List of exam results retrieved successfully.' })
  @CheckAbilities({ action: Action.READ, subject: Role.ADMIN })
  findAll(@Query() query: ExamResultQueryDto) {
    return this.examResultsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific exam result by ID' })
  @ApiOkResponse({ description: 'Exam result retrieved successfully.' })
  @ApiParam({ name: 'id', description: 'Exam result ID to retrieve' })
  @ApiNotFoundResponse({ description: 'Exam result not found.' })
  @CheckAbilities({ action: Action.READ, subject: Role.ADMIN })
  findOne(@Param('id') id: string) {
    return this.examResultsService.findOne(id);
  }
}
