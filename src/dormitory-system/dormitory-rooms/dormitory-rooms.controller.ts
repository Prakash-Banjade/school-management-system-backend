import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DormitoryRoomsService } from './dormitory-rooms.service';
import { CreateDormitoryRoomDto } from './dto/create-dormitory-room.dto';
import { UpdateDormitoryRoomDto } from './dto/update-dormitory-room.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QueryDto } from 'src/common/dto/query.dto';
import { ChekcAbilities } from 'src/common/decorators/abilities.decorator';
import { Action } from 'src/common/types/global.type';

@ApiBearerAuth()
@ApiTags('Dormitory Rooms')
@Controller('dormitory-rooms')
export class DormitoryRoomsController {
  constructor(private readonly dormitoryRoomsService: DormitoryRoomsService) { }

  @Post()
  create(@Body() createDormitoryRoomDto: CreateDormitoryRoomDto) {
    return this.dormitoryRoomsService.create(createDormitoryRoomDto);
  }

  @Get()
  findAll(@Query() queryDto: QueryDto) {
    return this.dormitoryRoomsService.findAll(queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dormitoryRoomsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDormitoryRoomDto: UpdateDormitoryRoomDto) {
    return this.dormitoryRoomsService.update(id, updateDormitoryRoomDto);
  }

  @Delete(':id')
  @ChekcAbilities({ action: Action.DELETE, subject: 'all' })
  remove(@Param('id') id: string) {
    return this.dormitoryRoomsService.remove(id);
  }
}
