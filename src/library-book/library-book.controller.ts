import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { LibraryBookService } from './library-book.service';
import { CreateLibraryBookDto } from './dto/create-library-book.dto';
import { UpdateLibraryBookDto } from './dto/update-library-book.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QueryDto } from 'src/core/dto/query.dto';
import { Action } from 'src/core/types/global.types';
import { ChekcAbilities } from 'src/core/decorators/abilities.decorator';

@ApiBearerAuth()
@ApiTags('Library Book')
@Controller('library-books')
export class LibraryBookController {
  constructor(private readonly libraryBookService: LibraryBookService) { }

  @Post()
  create(@Body() createLibraryBookDto: CreateLibraryBookDto) {
    return this.libraryBookService.create(createLibraryBookDto);
  }

  @Get()
  findAll(@Query() queryDto: QueryDto) {
    return this.libraryBookService.findAll(queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.libraryBookService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLibraryBookDto: UpdateLibraryBookDto) {
    return this.libraryBookService.update(id, updateLibraryBookDto);
  }

  @Delete(':id')
  @ChekcAbilities({ action: Action.DELETE, subject: 'all' })
  remove(@Param('id') id: string) {
    return this.libraryBookService.remove(id);
  }
}
