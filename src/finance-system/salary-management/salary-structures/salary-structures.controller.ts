import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { SalaryStructuresService } from './salary-structures.service';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateSalaryStructureDto } from './dto/update-salary-structure.dto';
import { SalaryStructuresQueryDto } from './dto/salary-structures-query.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { CurrentUser } from 'src/common/decorators/user.decorator';

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
  @ApiParam({ name: 'id', type: 'string', description: 'ID of the salary structure' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateSalaryStructureDto: UpdateSalaryStructureDto) {
    return this.salaryStructuresService.update(id, updateSalaryStructureDto);
  }

  @Get('my-details')
  @ApiOperation({ summary: 'Get my salary details' })
  @ApiResponse({ status: 200, description: 'My salary details retrieved successfully' })
  @CheckAbilities({ subject: Role.TEACHER, action: Action.UPDATE })
  getMySalaryDetails(@CurrentUser() currentUser: AuthUser) {
    return this.salaryStructuresService.getMySalaryDetails(currentUser);
  }
}
