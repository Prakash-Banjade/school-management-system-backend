import { Controller, Get, Post, Body, Query, UseInterceptors } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrollmentQueryDto } from './dto/enrollment-query.dto';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Enrollments')
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) { }

  @Post()
  @ApiOperation({ summary: 'Create new enrollment' })
  @ApiResponse({ status: 201, description: 'Enrollment successfully created.' })
  @ApiResponse({ status: 403, description: 'Promotion are only allowed from latest academic year' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @ApiResponse({ status: 404, description: 'Class room not found' })
  @ApiResponse({ status: 409, description: 'Enrollment already exists' })
  @UseInterceptors(TransactionInterceptor)
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(createEnrollmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all enrollments' })
  @ApiResponse({ status: 200, description: 'Enrollments successfully retrieved.' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAll(@Query() queryDto: EnrollmentQueryDto) {
    return this.enrollmentsService.findAll(queryDto);
  }
}
