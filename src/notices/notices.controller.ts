import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { NoticesService } from './notices.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { NoticesQueryDto } from './dto/notices-query.dto';

@ApiBearerAuth()
@ApiTags('Notices')
@Controller('notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new notice' })
  @ApiOkResponse({ description: 'Notice created successfully' })
  @CheckAbilities({ action: Action.CREATE, subject: Role.ADMIN })
  create(@Body() createNoticeDto: CreateNoticeDto) {
    return this.noticesService.create(createNoticeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notices' })
  @ApiOkResponse({ description: 'Notices retrieved successfully' })
  @CheckAbilities({ action: Action.READ, subject: Role.USER })
  findAll(@Query() queryDto: NoticesQueryDto) {
    return this.noticesService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a notice' })
  @ApiOkResponse({ description: 'Notice retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Notice not found' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID of the notice' })
  @CheckAbilities({ action: Action.READ, subject: Role.USER })
  findOne(@Param('id') id: string) {
    return this.noticesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a notice' })
  @ApiOkResponse({ description: 'Notice updated successfully' })
  @ApiNotFoundResponse({ description: 'Notice not found' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID of the notice' })
  @CheckAbilities({ action: Action.UPDATE, subject: Role.ADMIN })
  update(@Param('id') id: string, @Body() updateNoticeDto: UpdateNoticeDto) {
    return this.noticesService.update(id, updateNoticeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notice' })
  @ApiOkResponse({ description: 'Notice deleted successfully' })
  @ApiNotFoundResponse({ description: 'Notice not found' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID of the notice' })
  @CheckAbilities({ action: Action.DELETE, subject: Role.ADMIN })
  remove(@Param('id') id: string) {
    return this.noticesService.remove(id);
  }
}
