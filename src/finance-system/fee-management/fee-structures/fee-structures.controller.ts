import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { FeeStructuresService } from './fee-structures.service';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { UpdateFeeStructureDto } from './dto/update-fee-structure.dto';
import { FeeStructureQueryDto } from './dto/fee-structure-query.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';

@ApiBearerAuth()
@ApiTags('Fee Structures')
@Controller('fee-structures')
export class FeeStructuresController {
  constructor(private readonly feeStructuresService: FeeStructuresService) { }

  @Post()
  @ApiOperation({ summary: 'Create Fee Structure' })
  @ApiResponse({ status: 201, description: 'Fee Structure created successfully' })
  @ApiResponse({ status: 404, description: 'Charge head not found' })
  @ApiResponse({ status: 404, description: 'Class room not found' })
  @ApiResponse({ status: 409, description: 'Charge head already exists in class room' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  create(@Body() createFeeStructureDto: CreateFeeStructureDto) {
    return this.feeStructuresService.create(createFeeStructureDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get All Fee Structures' })
  @ApiResponse({ status: 200, description: 'Fee Structures fetched successfully' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAll(@Query() queryDto: FeeStructureQueryDto) {
    return this.feeStructuresService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Fee Structure By Id' })
  @ApiResponse({ status: 200, description: 'Fee Structure fetched successfully' })
  @ApiResponse({ status: 404, description: 'Fee Structure not found' })
  @ApiParam({ name: "id", description: "Fee structure id" })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.feeStructuresService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Fee Structure' })
  @ApiResponse({ status: 200, description: 'Fee Structure updated successfully' })
  @ApiResponse({ status: 404, description: 'Fee Structure not found' })
  @ApiParam({ name: "id", description: "Fee structure id" })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  update(@Param('id') id: string, @Body() updateFeeStructureDto: UpdateFeeStructureDto) {
    return this.feeStructuresService.update(id, updateFeeStructureDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Fee Structure' })
  @ApiResponse({ status: 200, description: 'Fee Structure deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete mandatory fee structure' })
  @ApiParam({ name: "id", description: "Fee structure id" })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.DELETE })
  remove(@Param('id') id: string) {
    return this.feeStructuresService.remove(id);
  }
}
