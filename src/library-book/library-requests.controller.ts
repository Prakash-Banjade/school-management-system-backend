import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateLibraryBookRequestDto, UpdateLibraryBookRequestDto } from './dto/create-library-book-request.dto';
import { LibraryBookRequestService } from './library-requests.service';
import { QueryDto } from 'src/common/dto/query.dto';
import { ChekcAbilities } from 'src/common/decorators/abilities.decorator';
import { Action } from 'src/common/types/global.type';

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
