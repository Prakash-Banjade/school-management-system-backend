import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { BookCategoriesService } from './book-categories.service';
import { CreateBookCategoryDto } from './dto/create-book-category.dto';
import { UpdateBookCategoryDto } from './dto/update-book-category.dto';
import { QueryDto } from 'src/common/dto/query.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Book Categories')
@Controller('book-categories')
export class BookCategoriesController {
  constructor(private readonly bookCategoriesService: BookCategoriesService) { }

  @Post()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  create(@Body() createBookCategoryDto: CreateBookCategoryDto) {
    return this.bookCategoriesService.create(createBookCategoryDto);
  }

  @Get()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAll(@Query() queryDto: QueryDto) {
    return this.bookCategoriesService.findAll(queryDto);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.bookCategoriesService.findOne(id);
  }

  @Patch(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  update(@Param('id') id: string, @Body() updateBookCategoryDto: UpdateBookCategoryDto) {
    return this.bookCategoriesService.update(id, updateBookCategoryDto);
  }

  @Delete(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.DELETE })
  remove(@Param('id') id: string) {
    return this.bookCategoriesService.remove(id);
  }
}
