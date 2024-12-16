import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { SalaryStructuresService } from './salary-structures.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UpdateSalaryStructureDto } from './dto/update-salary-structure.dto';
import { SalaryStructuresQueryDto } from './dto/salary-structures-query.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';

@ApiBearerAuth()
@ApiTags('Salary Structures')
@Controller('salary-structures')
export class SalaryStructuresController {
  constructor(private readonly salaryStructuresService: SalaryStructuresService) { }

  @Get()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAll(@Query() query: SalaryStructuresQueryDto) {
    return this.salaryStructuresService.findAll(query);
  }

  // @Post() // TODO: remove in production
  // @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  // createSalaryStructureForAllEmployees() {
  //   return this.salaryStructuresService.createSalaryStructureForAllEmployees();
  // }

  @Patch(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateSalaryStructureDto: UpdateSalaryStructureDto) {
    return this.salaryStructuresService.update(id, updateSalaryStructureDto);
  }
}
