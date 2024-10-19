import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, Query } from '@nestjs/common';
import { ClassRoomsService } from './class-rooms.service';
import { CreateClassRoomDto } from './dto/create-class-room.dto';
import { UpdateClassRoomDto } from './dto/update-class-room.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClassRoomQueryDto } from './dto/classRoom-query.dto';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { ApiPaginatedResponse } from 'src/common/decorators/apiPaginatedResponse.decorator';

@ApiBearerAuth()
@ApiTags('Class rooms')
@Controller('class-rooms')
export class ClassRoomsController {
  constructor(private readonly classRoomsService: ClassRoomsService) { }

  @Post()
  @UseInterceptors(TransactionInterceptor)
  create(@Body() createClassRoomDto: CreateClassRoomDto) {
    return this.classRoomsService.create(createClassRoomDto);
  }

  @Get()
  @ApiPaginatedResponse(CreateClassRoomDto)
  findAll(@Query() queryDto: ClassRoomQueryDto) {
    return this.classRoomsService.findAll(queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.classRoomsService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(TransactionInterceptor)
  update(@Param('id') id: string, @Body() updateClassRoomDto: UpdateClassRoomDto) {
    return this.classRoomsService.update(id, updateClassRoomDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.classRoomsService.remove(id);
  }
}
