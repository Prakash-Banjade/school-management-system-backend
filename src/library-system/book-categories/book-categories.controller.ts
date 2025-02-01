import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { BookCategoriesService } from './book-categories.service';
import { CreateBookCategoryDto } from './dto/create-book-category.dto';
import { UpdateBookCategoryDto } from './dto/update-book-category.dto';
import { QueryDto } from 'src/common/dto/query.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';

@ApiBearerAuth()
@ApiTags('Book Categories')
@Controller('book-categories')
export class BookCategoriesController {
  constructor(private readonly bookCategoriesService: BookCategoriesService) { }

  @Post()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  @ApiOperation({ summary: 'Create a new book category' })
  @ApiResponse({ status: 201, description: 'Book category created successfully' })
  @ApiResponse({ status: 409, description: 'Book category already exists' })
  create(@Body() createBookCategoryDto: CreateBookCategoryDto) {
    return this.bookCategoriesService.create(createBookCategoryDto);
  }

  @Get()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  @ApiOperation({ summary: 'Get all book categories' })
  @ApiResponse({ status: 200, description: 'Book categories retrieved successfully' })
  findAll(@Query() queryDto: QueryDto) {
    return this.bookCategoriesService.findAll(queryDto);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  @ApiOperation({ summary: 'Get a book category by ID' })
  @ApiResponse({ status: 200, description: 'Book category retrieved successfully' })
  @ApiParam({ name: 'id', description: 'ID of the book category' })
  findOne(@Param('id') id: string) {
    return this.bookCategoriesService.findOne(id);
  }

  @Patch(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  @ApiOperation({ summary: 'Update a book category' })
  @ApiResponse({ status: 200, description: 'Book category updated successfully' })
  @ApiResponse({ status: 404, description: 'Book category not found' })
  @ApiResponse({ status: 409, description: 'Book category already exists' })
  @ApiParam({ name: 'id', description: 'ID of the book category' })
  update(@Param('id') id: string, @Body() updateBookCategoryDto: UpdateBookCategoryDto) {
    return this.bookCategoriesService.update(id, updateBookCategoryDto);
  }

  @Delete(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.DELETE })
  @ApiOperation({ summary: 'Delete a book category' })
  @ApiResponse({ status: 200, description: 'Book category deleted successfully' })
  @ApiParam({ name: 'id', description: 'ID of the book category' })
  remove(@Param('id') id: string) {
    return this.bookCategoriesService.remove(id);
  }
}