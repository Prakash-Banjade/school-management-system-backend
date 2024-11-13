import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DormitoryRoomsService } from './dormitory-rooms.service';
import { CreateDormitoryRoomDto } from './dto/create-dormitory-room.dto';
import { UpdateDormitoryRoomDto } from './dto/update-dormitory-room.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QueryDto } from 'src/common/dto/query.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { CurrentUser } from 'src/common/decorators/user.decorator';

@ApiBearerAuth()
@ApiTags('Dormitory Rooms')
@Controller('dormitory-rooms')
export class DormitoryRoomsController {
  constructor(private readonly dormitoryRoomsService: DormitoryRoomsService) { }

  @Post()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  create(@Body() createDormitoryRoomDto: CreateDormitoryRoomDto) {
    return this.dormitoryRoomsService.create(createDormitoryRoomDto);
  }

  @Get()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAll(@Query() queryDto: QueryDto) {
    return this.dormitoryRoomsService.findAll(queryDto);
  }

  @Get('options')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getOptions(@Query() queryDto: QueryDto) {
    return this.dormitoryRoomsService.getOptions(queryDto);
  }

  @Get('me')
  @CheckAbilities({ subject: Role.STUDENT, action: Action.READ })
  getStudentDormitory(@CurrentUser() currentUser: AuthUser) {
    return this.dormitoryRoomsService.getStudentDormitory(currentUser);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.dormitoryRoomsService.findOne(id);
  }

  @Patch(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  update(@Param('id') id: string, @Body() updateDormitoryRoomDto: UpdateDormitoryRoomDto) {
    return this.dormitoryRoomsService.update(id, updateDormitoryRoomDto);
  }

  @Delete(':id')
  @CheckAbilities({ action: Action.DELETE, subject: Role.ADMIN })
  remove(@Param('id') id: string) {
    return this.dormitoryRoomsService.remove(id);
  }
}
