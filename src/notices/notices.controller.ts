import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { NoticesService } from './notices.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QueryDto } from 'src/common/dto/query.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';

@ApiBearerAuth()
@ApiTags('Notices')
@Controller('notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) { }

  @Post()
  @CheckAbilities({ action: Action.CREATE, subject: Role.ADMIN })
  create(@Body() createNoticeDto: CreateNoticeDto) {
    return this.noticesService.create(createNoticeDto);
  }

  @Get()
  @CheckAbilities({ action: Action.READ, subject: Role.USER })
  findAll(@Query() queryDto: QueryDto) {
    return this.noticesService.findAll(queryDto);
  }

  @Get(':id')
  @CheckAbilities({ action: Action.READ, subject: Role.USER })
  findOne(@Param('id') id: string) {
    return this.noticesService.findOne(id);
  }

  @Patch(':id')
  @CheckAbilities({ action: Action.UPDATE, subject: Role.ADMIN })
  update(@Param('id') id: string, @Body() updateNoticeDto: UpdateNoticeDto) {
    return this.noticesService.update(id, updateNoticeDto);
  }

  @Delete(':id')
  @CheckAbilities({ action: Action.DELETE, subject: Role.ADMIN })
  remove(@Param('id') id: string) {
    return this.noticesService.remove(id);
  }
}
