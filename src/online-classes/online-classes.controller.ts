import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { OnlineClassesService } from './online-classes.service';
import { CreateOnlineClassDto } from './dto/create-online-class.dto';
import { UpdateOnlineClassDto } from './dto/update-online-class.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OnlineClassQueryDto } from './dto/online-class-query.dto';

@ApiBearerAuth()
@ApiTags('Online Classes')
@Controller('online-classes')
export class OnlineClassesController {
  constructor(private readonly onlineClassesService: OnlineClassesService) { }

  @Post()
  @CheckAbilities({ subject: Role.TEACHER, action: Action.CREATE })
  create(@Body() createOnlineClassDto: CreateOnlineClassDto) {
    return this.onlineClassesService.create(createOnlineClassDto);
  }

  @Get()
  @CheckAbilities({ subject: Role.TEACHER, action: Action.READ })
  findAll(@Query() queryDto: OnlineClassQueryDto) {
    return this.onlineClassesService.findAll(queryDto);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.TEACHER, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.onlineClassesService.findOne(id);
  }

  @Patch(':id')
  @CheckAbilities({ subject: Role.TEACHER, action: Action.UPDATE })
  update(@Param('id') id: string, @Body() updateOnlineClassDto: UpdateOnlineClassDto) {
    return this.onlineClassesService.update(id, updateOnlineClassDto);
  }

  @Delete(':id')
  @CheckAbilities({ subject: Role.TEACHER, action: Action.DELETE })
  remove(@Param('id') id: string) {
    return this.onlineClassesService.remove(id);
  }
}
