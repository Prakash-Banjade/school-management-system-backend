import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, Query } from '@nestjs/common';
import { ClassRoomsService } from './class-rooms.service';
import { CreateClassRoomDto } from './dto/create-class-room.dto';
import { UpdateClassRoomDto } from './dto/update-class-room.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClassRoomQueryDto } from './dto/classRoom-query.dto';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { ApiPaginatedResponse } from 'src/common/decorators/apiPaginatedResponse.decorator';
import { ChekcAbilities } from 'src/common/decorators/abilities.decorator';
import { Action } from 'src/common/types/global.type';
import { ClassRoomsHelper } from './helpers/class-rooms.helper';

@ApiBearerAuth()
@ApiTags('Class rooms')
@Controller('class-rooms')
export class ClassRoomsController {
  constructor(
    private readonly classRoomsService: ClassRoomsService,
    private readonly classRoomsHelper: ClassRoomsHelper
  ) { }

  @Post()
  @UseInterceptors(TransactionInterceptor)
  @ChekcAbilities({ subject: 'all', action: Action.CREATE })
  create(@Body() createClassRoomDto: CreateClassRoomDto) {
    return this.classRoomsService.create(createClassRoomDto);
  }

  @Get()
  @ApiPaginatedResponse(CreateClassRoomDto)
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  findAll(@Query() queryDto: ClassRoomQueryDto) {
    return this.classRoomsService.findAll(queryDto);
  }

  @Get('options')
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  findAllOptions(@Query() queryDto: ClassRoomQueryDto) {
    return this.classRoomsHelper.getClassRoomsOptions(queryDto);
  }

  @Get(':id')
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.classRoomsService.findOne(id);
  }

  @Patch(':id')
  @ChekcAbilities({ subject: 'all', action: Action.UPDATE })
  @UseInterceptors(TransactionInterceptor)
  update(@Param('id') id: string, @Body() updateClassRoomDto: UpdateClassRoomDto) {
    return this.classRoomsService.update(id, updateClassRoomDto);
  }

  @Delete(':id')
  @ChekcAbilities({ subject: 'all', action: Action.DELETE })
  remove(@Param('id') id: string) {
    return this.classRoomsService.remove(id);
  }
}
