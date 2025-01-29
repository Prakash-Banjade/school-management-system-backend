import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DormitoryRoomsService } from './dormitory-rooms.service';
import { CreateDormitoryRoomDto } from './dto/create-dormitory-room.dto';
import { UpdateDormitoryRoomDto } from './dto/update-dormitory-room.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create dormitory room' })
  @ApiResponse({ status: 201, description: 'Dormitory room created' })
  @ApiResponse({ status: 409, description: 'Room number already exists' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  create(@Body() createDormitoryRoomDto: CreateDormitoryRoomDto) {
    return this.dormitoryRoomsService.create(createDormitoryRoomDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all dormitory rooms' })
  @ApiResponse({ status: 200, description: 'Dormitory rooms list' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAll(@Query() queryDto: QueryDto) {
    return this.dormitoryRoomsService.findAll(queryDto);
  }

  @Get('options')
  @ApiOperation({ summary: 'Get dormitory rooms options' })
  @ApiResponse({ status: 200, description: 'Dormitory rooms options' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getOptions(@Query() queryDto: QueryDto) {
    return this.dormitoryRoomsService.getOptions(queryDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my dormitory' })
  @ApiResponse({ status: 200, description: 'My dormitory along with other members.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only student can access' })
  @ApiResponse({ status: 404, description: 'Not assigned to any dormitory' })
  @CheckAbilities({ subject: Role.STUDENT, action: Action.READ })
  getStudentDormitory(@CurrentUser() currentUser: AuthUser) {
    return this.dormitoryRoomsService.getStudentDormitory(currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single dormitory room by id' })
  @ApiResponse({ status: 200, description: 'Dormitory room details' })
  @ApiResponse({ status: 404, description: 'Dormitory room not found' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.dormitoryRoomsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update dormitory room' })
  @ApiResponse({ status: 200, description: 'Dormitory room updated' })
  @ApiResponse({ status: 404, description: 'Dormitory room not found' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  update(@Param('id') id: string, @Body() updateDormitoryRoomDto: UpdateDormitoryRoomDto) {
    return this.dormitoryRoomsService.update(id, updateDormitoryRoomDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete dormitory room' })
  @ApiResponse({ status: 200, description: 'Dormitory room deleted' })
  @CheckAbilities({ action: Action.DELETE, subject: Role.ADMIN })
  remove(@Param('id') id: string) {
    return this.dormitoryRoomsService.remove(id);
  }
}
