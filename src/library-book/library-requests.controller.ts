import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QueryDto } from 'src/core/dto/query.dto';
import { Action } from 'src/core/types/global.types';
import { ChekcAbilities } from 'src/core/decorators/abilities.decorator';
import { CreateLibraryBookRequestDto, UpdateLibraryBookRequestDto } from './dto/create-library-book-request.dto';
import { LibraryBookRequestService } from './library-requests.service';

@ApiBearerAuth()
@ApiTags('Library Book Request')
@Controller('library-book-requests')
export class LibraryBookRequestController {
    constructor(private readonly libraryBookRequestService: LibraryBookRequestService) { }

    @Post()
    create(@Body() createLibraryBookRequestDto: CreateLibraryBookRequestDto) {
        return this.libraryBookRequestService.create(createLibraryBookRequestDto);
    }

    @Get()
    findAll(@Query() queryDto: QueryDto) {
        return this.libraryBookRequestService.findAll(queryDto);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.libraryBookRequestService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateLibraryBookRequestDto: UpdateLibraryBookRequestDto) {
        return this.libraryBookRequestService.update(id, updateLibraryBookRequestDto);
    }

    @Delete(':id')
    @ChekcAbilities({ action: Action.DELETE, subject: 'all' })
    remove(@Param('id') id: string) {
        return this.libraryBookRequestService.remove(id);
    }
}
