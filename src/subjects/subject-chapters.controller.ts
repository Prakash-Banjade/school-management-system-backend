import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateSubjectChapterDto, SubjectChapterQueryDto, UpdateSubjectChapterDto } from './dto/subject-chapter.dto';
import { SubjectChaptersService } from './subject-chapters.service';
import { ApiPaginatedResponse } from 'src/common/decorators/apiPaginatedResponse.decorator';
import { ChekcAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, AuthUser } from 'src/common/types/global.type';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';

@ApiBearerAuth()
@ApiTags('Subject Chapters')
@Controller('subject-chapters')
export class SubjectChaptersController {
    constructor(private readonly subjectChaptersService: SubjectChaptersService) { }

    @Post()
    @ChekcAbilities({ subject: 'all', action: Action.CREATE })
    create(@Body() createSubjectChapterDto: CreateSubjectChapterDto, @CurrentUser() currentUser: AuthUser) {
        return this.subjectChaptersService.create(createSubjectChapterDto, currentUser);
    }

    @Get()
    @ApiPaginatedResponse(CreateSubjectChapterDto)
    @ChekcAbilities({ subject: 'all', action: Action.READ })
    findAll(@Query() queryDto: SubjectChapterQueryDto) {
        return this.subjectChaptersService.findAll(queryDto);
    }

    @Get(':id')
    @ChekcAbilities({ subject: 'all', action: Action.READ })
    findOne(@Param('id') id: string) {
        return this.subjectChaptersService.findOne(id);
    }

    @Patch(':id')
    @ChekcAbilities({ subject: 'all', action: Action.UPDATE })
    update(@Param('id') id: string, @Body() updateSubjectChapterDto: UpdateSubjectChapterDto) {
        return this.subjectChaptersService.update(id, updateSubjectChapterDto);
    }

    @Delete(':id')
    @ChekcAbilities({ subject: 'all', action: Action.DELETE })
    @UseInterceptors(TransactionInterceptor)
    remove(@Param('id') id: string) {
        return this.subjectChaptersService.remove(id);
    }
}
