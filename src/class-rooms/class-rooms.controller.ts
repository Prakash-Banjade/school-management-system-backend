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
import { AttendanceStatisticsQueryDto } from './dto/attendance-statistics-query.dto';
import { ClassRoomsStatistics } from './helpers/class-rooms.statistics';

@ApiBearerAuth()
@ApiTags('Class rooms')
@Controller('class-rooms')
export class ClassRoomsController {
  constructor(
    private readonly classRoomsService: ClassRoomsService,
    private readonly classRoomsHelper: ClassRoomsHelper,
    private readonly classRoomsStatistics: ClassRoomsStatistics,
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

  @Get('sections')
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  findAllSections(@Query() queryDto: ClassRoomQueryDto) {
    return this.classRoomsService.findAllSections(queryDto);
  }

  // used in single class room page in frontend
  @Get(':id/details')
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  getClassRoomDetails(@Param('id') id: string) {
    return this.classRoomsHelper.getClassRoomDetails(id);
  }

  @Get(':id/attendance-statistics')
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  getAttendanceStatistics(@Param('id') id: string, @Query() queryDto: AttendanceStatisticsQueryDto) {
    return this.classRoomsStatistics.getAttendanceStatistics(id, queryDto);
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
