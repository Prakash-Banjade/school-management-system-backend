import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RoomTypesService } from './room-types.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QueryDto } from 'src/common/dto/query.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';

@ApiBearerAuth()
@ApiTags('Room Types')
@Controller('room-types')
export class RoomTypesController {
  constructor(private readonly roomTypesService: RoomTypesService) { }

  @Post()
  @ApiOperation({ summary: 'Create room type' })
  @ApiResponse({ status: 201, description: 'Room type created' })
  @ApiResponse({ status: 409, description: 'Room type with same name already exists' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  create(@Body() createRoomTypeDto: CreateRoomTypeDto) {
    return this.roomTypesService.create(createRoomTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all room types' })
  @ApiResponse({ status: 200, description: 'Room types list' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAll(@Query() queryDto: QueryDto) {
    return this.roomTypesService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get room type by id' })
  @ApiResponse({ status: 200, description: 'Room type details' })
  @ApiResponse({ status: 404, description: 'Room type not found' })
  @ApiParam({ name: 'id', description: "Room type id", required: true })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.roomTypesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update room type' })
  @ApiResponse({ status: 200, description: 'Room type updated' })
  @ApiResponse({ status: 404, description: 'Room type not found' })
  @ApiResponse({ status: 409, description: 'Room type with same name already exists' })
  @ApiParam({ name: 'id', description: "Room type id", required: true })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  update(@Param('id') id: string, @Body() updateRoomTypeDto: UpdateRoomTypeDto) {
    return this.roomTypesService.update(id, updateRoomTypeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete room type' })
  @ApiResponse({ status: 200, description: 'Room type deleted' })
  @ApiParam({ name: 'id', description: "Room type id", required: true })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.DELETE })
  remove(@Param('id') id: string) {
    return this.roomTypesService.remove(id);
  }
}
