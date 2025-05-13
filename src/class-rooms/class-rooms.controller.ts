import { Controller, Get, Post, Body, Patch, Param, UseInterceptors, Query } from '@nestjs/common';
import { ClassRoomsService } from './class-rooms.service';
import { CreateClassRoomDto } from './dto/create-class-room.dto';
import { UpdateClassRoomDto } from './dto/update-class-room.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ClassRoomOptionsQueryDto, ClassRoomQueryDto } from './dto/classRoom-query.dto';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { ApiPaginatedResponse } from 'src/common/decorators/apiPaginatedResponse.decorator';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { ClassRoomsHelper } from './helpers/class-rooms.helper';
import { AttendanceStatisticsQueryDto } from './dto/attendance-statistics-query.dto';
import { ClassRoomsStatistics } from './helpers/class-rooms.statistics';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { ClassRoomsTeacherViewService } from './helpers/class-rooms_teacher-view.service';
import { isTeacher } from 'src/utils/utils';

@ApiBearerAuth()
@ApiTags('Class rooms')
@Controller('class-rooms')
export class ClassRoomsController {
  constructor(
    private readonly classRoomsService: ClassRoomsService,
    private readonly classRoomsHelper: ClassRoomsHelper,
    private readonly classRoomsStatistics: ClassRoomsStatistics,
    private readonly classRoomsTeacherViewService: ClassRoomsTeacherViewService,
  ) { }

  @Post()
  @UseInterceptors(TransactionInterceptor)
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  @ApiOperation({ summary: 'Create a new class room' })
  @ApiResponse({ status: 201, description: 'Class room successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 404, description: 'Faculty not found.' })
  @ApiResponse({ status: 409, description: 'Class room with same name already exists' })
  create(@Body() createClassRoomDto: CreateClassRoomDto) {
    return this.classRoomsService.create(createClassRoomDto);
  }

  @Get()
  @ApiPaginatedResponse(CreateClassRoomDto)
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.TEACHER, action: Action.READ }
  )
  @ApiOperation({ summary: 'Get a list of class rooms' })
  @ApiResponse({ status: 200, description: 'List of class rooms retrieved successfully.' })
  findAll(@Query() queryDto: ClassRoomQueryDto, @CurrentUser() currentUser: AuthUser) {
    return isTeacher(currentUser)
      ? this.classRoomsTeacherViewService.findAll(queryDto, currentUser)
      : this.classRoomsHelper.findAll(queryDto);
  }

  @Get('options')
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.TEACHER, action: Action.READ },
  )
  @ApiOperation({ summary: 'Get options for class rooms' })
  @ApiResponse({ status: 200, description: 'Class room options retrieved successfully.' })
  findAllOptions(@Query() queryDto: ClassRoomOptionsQueryDto) {
    return this.classRoomsHelper.getClassRoomsOptions(queryDto);
  }

  @Get(':id/details')
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.TEACHER, action: Action.READ }
  )
  @ApiOperation({ summary: 'Get details of a specific class room' })
  @ApiParam({ name: 'id', description: 'The ID of the class room' })
  @ApiResponse({ status: 200, description: 'Class room details retrieved successfully.' })
  getClassRoomDetails(@Param('id') id: string) {
    return this.classRoomsHelper.getClassRoomDetails(id);
  }

  @Get(':id/attendance-statistics')
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.TEACHER, action: Action.READ }
  )
  @ApiOperation({ summary: 'Get attendance statistics for a specific class room' })
  @ApiParam({ name: 'id', description: 'The ID of the class room' })
  @ApiResponse({ status: 200, description: 'Attendance statistics retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Class room not found.' })
  getAttendanceStatistics(@Param('id') id: string, @Query() queryDto: AttendanceStatisticsQueryDto) {
    return this.classRoomsStatistics.getAttendanceStatistics(id, queryDto);
  }

  @Get('assigned')
  @CheckAbilities({ subject: Role.TEACHER, action: Action.READ })
  @ApiOperation({ summary: 'Get all classes assigned to the current teacher' })
  @ApiResponse({ status: 200, description: 'Assigned classes retrieved successfully.' })
  getMyAssignedClasses(@Query() queryDto: ClassRoomQueryDto) {
    return this.classRoomsHelper.getMyAssignedClasses(queryDto);
  }

  @Get('my-class')
  @ApiOperation({ summary: 'Get my class info' })
  @ApiResponse({ status: 200, description: 'My class info returned successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only student can access.' })
  @CheckAbilities({ subject: Role.STUDENT, action: Action.READ })
  getMyInfo(@CurrentUser() currentUser: AuthUser) {
    return this.classRoomsService.getMyClassInfo(currentUser);
  }

  @Get(':id')
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.TEACHER, action: Action.READ }
  )
  @ApiOperation({ summary: 'Get a specific class room by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the class room' })
  @ApiResponse({ status: 200, description: 'Class room retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Class room not found.' })
  findOne(@Param('id') id: string) {
    return this.classRoomsService.findOne(id);
  }

  @Patch(':id/update-roll-no')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  @UseInterceptors(TransactionInterceptor)
  @ApiOperation({ summary: 'Update roll no of students alphabet wise in a class room' })
  @ApiParam({ name: 'id', description: 'The ID of the class room to update' })
  @ApiResponse({ status: 200, description: 'Roll no of students successfully updated.' })
  @ApiResponse({ status: 404, description: 'Class room not found.' })
  @UseInterceptors(TransactionInterceptor)
  updateRollNo(@Param('id') id: string) {
    return this.classRoomsService.updateRollNo(id);
  }

  @Patch(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  @UseInterceptors(TransactionInterceptor)
  @ApiOperation({ summary: 'Update a specific class room by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the class room to update' })
  @ApiResponse({ status: 200, description: 'Class room successfully updated.' })
  @ApiResponse({ status: 404, description: 'Class room not found.' })
  @ApiResponse({ status: 409, description: 'Class room with same name already exists' })
  update(@Param('id') id: string, @Body() updateClassRoomDto: UpdateClassRoomDto) {
    return this.classRoomsService.update(id, updateClassRoomDto);
  }
}
