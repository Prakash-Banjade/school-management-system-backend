import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors } from '@nestjs/common';
import { GuardiansService } from './guardians.service';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';
import { QueryDto } from 'src/core/dto/query.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TransactionInterceptor } from 'src/core/interceptors/transaction.interceptor';

@ApiBearerAuth()
@ApiTags('Guardians')
@Controller('guardians')
export class GuardiansController {
  constructor(private readonly guardiansService: GuardiansService) { }

  @Post()
  @UseInterceptors(TransactionInterceptor)
  create(@Body() createGuardianDto: CreateGuardianDto) {
    return this.guardiansService.create(createGuardianDto);
  }

  @Get()
  findAll(@Query() queryDto: QueryDto) {
    return this.guardiansService.findAll(queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.guardiansService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(TransactionInterceptor)
  update(@Param('id') id: string, @Body() updateGuardianDto: UpdateGuardianDto) {
    return this.guardiansService.update(id, updateGuardianDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.guardiansService.remove(id);
  }
}
