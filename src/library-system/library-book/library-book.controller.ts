import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { LibraryBookService } from './library-book.service';
import { CreateLibraryBookDto } from './dto/create-library-book.dto';
import { UpdateLibraryBookDto } from './dto/update-library-book.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QueryDto } from 'src/common/dto/query.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { LibraryBookQueryDto } from './dto/library-book.query.dto';
import { LibraryHelper } from './helpers/library.helper';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { isStudent } from 'src/utils/isStudent';

@ApiBearerAuth()
@ApiTags('Library Book')
@Controller('library-books')
export class LibraryBookController {
  constructor(
    private readonly libraryBookService: LibraryBookService,
    private readonly libraryHelper: LibraryHelper,
  ) { }

  @Post()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  create(@Body() createLibraryBookDto: CreateLibraryBookDto) {
    return this.libraryBookService.create(createLibraryBookDto);
  }

  @Get()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAll(@Query() queryDto: LibraryBookQueryDto) {
    return this.libraryBookService.findAll(queryDto);
  }

  @Get('count')
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
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getOptions(@Query() queryDto: QueryDto) {
    return this.libraryHelper.getOptions(queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.libraryBookService.findOne(id);
  }

  @Patch(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  update(@Param('id') id: string, @Body() updateLibraryBookDto: UpdateLibraryBookDto) {
    return this.libraryBookService.update(id, updateLibraryBookDto);
  }

  @Delete(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.DELETE })
  remove(@Param('id') id: string) {
    return this.libraryBookService.remove(id);
  }
}
