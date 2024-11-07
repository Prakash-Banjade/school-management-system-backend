import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { LibraryBookService } from './library-book.service';
import { CreateLibraryBookDto } from './dto/create-library-book.dto';
import { UpdateLibraryBookDto } from './dto/update-library-book.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QueryDto } from 'src/common/dto/query.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { LibraryBookQueryDto } from './dto/library-book.query.dto';
import { LibraryHelper } from './helpers/library.helper';

@ApiBearerAuth()
@ApiTags('Library Book')
@Controller('library-books')
export class LibraryBookController {
  constructor(
    private readonly libraryBookService: LibraryBookService,
    private readonly libraryHelper: LibraryHelper,
  ) { }

  @Post()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  create(@Body() createLibraryBookDto: CreateLibraryBookDto) {
    return this.libraryBookService.create(createLibraryBookDto);
  }

  @Get()
  findAll(@Query() queryDto: LibraryBookQueryDto) {
    return this.libraryBookService.findAll(queryDto);
  }

  @Get('count')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getDashboardCount() {
    return this.libraryHelper.getDashboardCount();
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
