import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrollmentQueryDto } from './dto/enrollment-query.dto';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';

@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) { }

  @Post()
  @UseInterceptors(TransactionInterceptor)
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(createEnrollmentDto);
  }

  @Get()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })

  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ }) findAll(@Query() queryDto: EnrollmentQueryDto) {
    return this.enrollmentsService.findAll(queryDto);
  }

  // @Get(':id')
  // @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  // findOne(@Param('id') id: string) {
  //   return this.enrollmentsService.findOne(id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateEnrollmentDto: UpdateEnrollmentDto) {
  //   return this.enrollmentsService.update(+id, updateEnrollmentDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.enrollmentsService.remove(+id);
  // }
}
