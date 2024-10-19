import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateSubjectChapterDto, UpdateSubjectChapterDto } from './dto/subject-chapter.dto';
import { SubjectChaptersService } from './subject-chapters.service';
import { QueryDto } from 'src/common/dto/query.dto';
import { ApiPaginatedResponse } from 'src/common/decorators/apiPaginatedResponse.decorator';

@ApiBearerAuth()
@ApiTags('Subject Chapters')
@Controller('subject-chapters')
export class SubjectChaptersController {
    constructor(private readonly subjectChaptersService: SubjectChaptersService) { }

    @Post()
    create(@Body() createSubjectChapterDto: CreateSubjectChapterDto) {
        return this.subjectChaptersService.create(createSubjectChapterDto);
    }

    @Get()
    @ApiPaginatedResponse(CreateSubjectChapterDto)
    findAll(@Query() queryDto: QueryDto) {
        return this.subjectChaptersService.findAll(queryDto);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.subjectChaptersService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateSubjectChapterDto: UpdateSubjectChapterDto) {
        return this.subjectChaptersService.update(id, updateSubjectChapterDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.subjectChaptersService.remove(id);
    }
}
