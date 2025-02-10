import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { QueryDto } from 'src/common/dto/query.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';

@ApiBearerAuth()
@ApiTags('Branches')
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) { }

  @Post()
  @ApiOperation({ summary: 'Create a branch' })
  @ApiCreatedResponse({ description: 'Branch created' })
  @ApiConflictResponse({ description: 'Branch name already exists' })
  @CheckAbilities({ subject: Role.SUPER_ADMIN, action: Action.CREATE })
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all branches' })
  @ApiOkResponse({ description: 'Successfully received branch list' })
  @CheckAbilities({ subject: Role.SUPER_ADMIN, action: Action.READ })
  findAll(@Query() queryDto: QueryDto) {
    return this.branchesService.findAll(queryDto);
  }

  @Get('options')
  @ApiOperation({ summary: 'Get all branches options' })
  @ApiOkResponse({ description: 'Successfully received branch options' })
  @CheckAbilities({ subject: Role.SUPER_ADMIN, action: Action.READ })
  getOptions(@Query() queryDto: QueryDto) {
    return this.branchesService.getOptions(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch by id', description: 'Get branch by id.' })
  @ApiNotFoundResponse({ description: 'Branch not found' })
  @ApiOkResponse({ description: 'Successfully received branch' })
  @ApiParam({ name: 'id', type: String })
  @CheckAbilities({ subject: Role.SUPER_ADMIN, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a branch', description: 'Update a branch with the given id.' })
  @ApiNotFoundResponse({ description: 'Branch not found' })
  @ApiOkResponse({ description: 'Successfully updated branch' })
  @ApiParam({ name: 'id', type: String })
  @CheckAbilities({ subject: Role.SUPER_ADMIN, action: Action.UPDATE })
  update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchesService.update(id, updateBranchDto);
  }
}
