import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateSubjectChapterDto, SubjectChapterQueryDto, UpdateChapterNoDto, UpdateSubjectChapterDto } from './dto/subject-chapter.dto';
import { SubjectChaptersService } from './subject-chapters.service';
import { ApiPaginatedResponse } from 'src/common/decorators/apiPaginatedResponse.decorator';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';

@ApiBearerAuth()
@ApiTags('Subject Chapters')
@Controller('subject-chapters')
export class SubjectChaptersController {
    constructor(private readonly subjectChaptersService: SubjectChaptersService) { }

    @Post()
    @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
    create(@Body() createSubjectChapterDto: CreateSubjectChapterDto) {
        return this.subjectChaptersService.create(createSubjectChapterDto);
    }

    @Get()
    @ApiPaginatedResponse(CreateSubjectChapterDto)
    @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
    findAll(@Query() queryDto: SubjectChapterQueryDto) {
        return this.subjectChaptersService.findAll(queryDto);
    }

    @Get(':id')
    @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
    findOne(@Param('id') id: string) {
        return this.subjectChaptersService.findOne(id);
    }

    @Patch('update-chapter-no')
    @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
    updateSequence(@Body() updateChapterNoDto: UpdateChapterNoDto) {
        return this.subjectChaptersService.updateChapterNo(updateChapterNoDto);
    }

    @Patch(':id')
    @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
    update(@Param('id') id: string, @Body() updateSubjectChapterDto: UpdateSubjectChapterDto) {
        return this.subjectChaptersService.update(id, updateSubjectChapterDto);
    }

    @Delete(':id')
    @CheckAbilities({ subject: Role.ADMIN, action: Action.DELETE })
    @UseInterceptors(TransactionInterceptor)
    remove(@Param('id') id: string) {
        return this.subjectChaptersService.remove(id);
    }
}
