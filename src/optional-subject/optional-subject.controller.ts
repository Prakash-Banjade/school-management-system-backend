import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OptionalSubjectService } from './optional-subject.service';
import { CreateOptionalSubjectDto } from './dto/create-optional-subject.dto';
import { UpdateOptionalSubjectDto } from './dto/update-optional-subject.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Student Optional Subject')
@Controller('student-optional-subject')
export class OptionalSubjectController {
  constructor(private readonly optionalSubjectService: OptionalSubjectService) {}
  
  @Get()
  findAll() {
    return this.optionalSubjectService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.optionalSubjectService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOptionalSubjectDto: UpdateOptionalSubjectDto) {
    return this.optionalSubjectService.update(+id, updateOptionalSubjectDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.optionalSubjectService.remove(+id);
  }
}
