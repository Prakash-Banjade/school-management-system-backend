import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { SalaryStructuresService } from './salary-structures.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Get all salary structures' })
  @ApiResponse({ status: 200, description: 'Salary structures retrieved successfully' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAll(@Query() query: SalaryStructuresQueryDto) {
    return this.salaryStructuresService.findAll(query);
  }

  @Patch(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  @ApiOperation({ summary: 'Update a salary structure' })
  @ApiResponse({ status: 200, description: 'Salary structure updated successfully' })
  @ApiResponse({ status: 404, description: 'Salary structure not found' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateSalaryStructureDto: UpdateSalaryStructureDto) {
    return this.salaryStructuresService.update(id, updateSalaryStructureDto);
  }
}
