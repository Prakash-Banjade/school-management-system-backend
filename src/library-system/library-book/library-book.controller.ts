import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { LibraryBookService } from './library-book.service';
import { CreateLibraryBookDto } from './dto/create-library-book.dto';
import { UpdateLibraryBookDto } from './dto/update-library-book.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QueryDto } from 'src/common/dto/query.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { LibraryBookQueryDto } from './dto/library-book.query.dto';
import { LibraryHelper } from './helpers/library.helper';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { isStudent } from 'src/utils/utils';

@ApiBearerAuth()
@ApiTags('Library Book')
@Controller('library-books')
export class LibraryBookController {
  constructor(
    private readonly libraryBookService: LibraryBookService,
    private readonly libraryHelper: LibraryHelper,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create a new library book' })
  @ApiResponse({ status: 201, description: 'Library book created successfully' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  create(@Body() createLibraryBookDto: CreateLibraryBookDto) {
    return this.libraryBookService.create(createLibraryBookDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all library books' })
  @ApiResponse({ status: 200, description: 'List of library books' })
  @CheckAbilities({ subject: Role.USER, action: Action.READ })
  findAll(@Query() queryDto: LibraryBookQueryDto) {
    return this.libraryBookService.findAll(queryDto);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get library overview dashboard count' })
  @ApiResponse({ status: 200, description: 'Library Overview Dashboard count' })
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.STUDENT, action: Action.READ }
  )
  getDashboardCount(@CurrentUser() currentUser: AuthUser) {
    return isStudent(currentUser)
      ? this.libraryHelper.getDashboardCount_student(currentUser)
      : this.libraryHelper.getDashboardCount();
  }

  @Get('options')
  @ApiOperation({ summary: 'Get options' })
  @ApiResponse({ status: 200, description: 'Options' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getOptions(@Query() queryDto: QueryDto) {
    return this.libraryHelper.getOptions(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a library book by ID' })
  @ApiResponse({ status: 200, description: 'Library book' })
  @ApiParam({ name: 'id', type: String, required: true, description: 'Library book ID' })
  @CheckAbilities({ subject: Role.USER, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.libraryBookService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a library book' })
  @ApiResponse({ status: 200, description: 'Library book updated successfully' })
  @ApiParam({ name: 'id', type: String, required: true, description: 'Library book ID' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  update(@Param('id') id: string, @Body() updateLibraryBookDto: UpdateLibraryBookDto) {
    return this.libraryBookService.update(id, updateLibraryBookDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a library book' })
  @ApiResponse({ status: 204, description: 'Library book deleted successfully' })
  @ApiParam({ name: 'id', type: String, required: true, description: 'Library book ID' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.DELETE })
  remove(@Param('id') id: string) {
    return this.libraryBookService.remove(id);
  }
}