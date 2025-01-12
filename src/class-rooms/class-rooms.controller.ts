import { Controller, Get, Post, Body, Patch, Param, UseInterceptors, Query } from '@nestjs/common';
import { ClassRoomsService } from './class-rooms.service';
import { CreateClassRoomDto } from './dto/create-class-room.dto';
import { UpdateClassRoomDto } from './dto/update-class-room.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClassRoomOptionsQueryDto, ClassRoomQueryDto } from './dto/classRoom-query.dto';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { ApiPaginatedResponse } from 'src/common/decorators/apiPaginatedResponse.decorator';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
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
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  create(@Body() createClassRoomDto: CreateClassRoomDto) {
    return this.classRoomsService.create(createClassRoomDto);
  }

  @Get()
  @ApiPaginatedResponse(CreateClassRoomDto)
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAll(@Query() queryDto: ClassRoomQueryDto) {
    return this.classRoomsHelper.findAll(queryDto);
  }

  @Get('options')
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.TEACHER, action: Action.READ },
  )
  findAllOptions(@Query() queryDto: ClassRoomOptionsQueryDto) {
    return this.classRoomsHelper.getClassRoomsOptions(queryDto);
  }

  // used in single class room page in frontend
  @Get(':id/details')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getClassRoomDetails(@Param('id') id: string) {
    return this.classRoomsHelper.getClassRoomDetails(id);
  }

  @Get(':id/attendance-statistics')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getAttendanceStatistics(@Param('id') id: string, @Query() queryDto: AttendanceStatisticsQueryDto) {
    return this.classRoomsStatistics.getAttendanceStatistics(id, queryDto);
  }

  @Get('assigned')
  @CheckAbilities({ subject: Role.TEACHER, action: Action.READ })
  getMyAssignedClasses(@Query() queryDto: ClassRoomQueryDto) {
    return this.classRoomsHelper.getMyAssignedClasses(queryDto);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.classRoomsService.findOne(id);
  }

  @Patch(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  @UseInterceptors(TransactionInterceptor)
  update(@Param('id') id: string, @Body() updateClassRoomDto: UpdateClassRoomDto) {
    return this.classRoomsService.update(id, updateClassRoomDto);
  }
}
