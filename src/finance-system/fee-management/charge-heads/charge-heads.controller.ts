import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors } from '@nestjs/common';
import { ChargeHeadsService } from './charge-heads.service';
import { CreateChargeHeadDto } from './dto/create-charge-head.dto';
import { UpdateChargeHeadDto } from './dto/update-charge-head.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChargeHeadOptionsQueryDto, ChargeHeadQueryDto } from './dto/charge-head-query.dto';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';

@ApiBearerAuth()
@ApiTags('Charge Heads')
@Controller('charge-heads')
export class ChargeHeadsController {
  constructor(private readonly chargeHeadsService: ChargeHeadsService) { }

  @Post()
  @ApiOperation({ summary: 'Create new charge head' })
  @ApiResponse({ status: 201, description: 'Charge head created successfully' })
  @ApiResponse({ status: 409, description: 'Charge head with same name already exists' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  @UseInterceptors(TransactionInterceptor)
  create(@Body() createChargeHeadDto: CreateChargeHeadDto) {
    return this.chargeHeadsService.create(createChargeHeadDto);
  }

  // @Post('add-mandatory-heads') // TODO: Remove this after adding the ability to add mandatory charge heads
  // @ApiExcludeEndpoint()
  // @UseInterceptors(TransactionInterceptor)
  // @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  // addMandatoryHeads() {
  //   return this.chargeHeadsService.addMandatoryHeads();
  // }

  @Get()
  @ApiOperation({ summary: 'Get all charge heads' })
  @ApiResponse({ status: 200, description: 'Charge heads fetched successfully' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAll(@Query() queryDto: ChargeHeadQueryDto) {
    return this.chargeHeadsService.findAll(queryDto);
  }

  @Get('options')
  @ApiOperation({ summary: 'Get charge head options' })
  @ApiResponse({ status: 200, description: 'Charge head options fetched successfully' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getOptions(@Query() queryDto: ChargeHeadOptionsQueryDto) {
    return this.chargeHeadsService.getOptions(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get charge head by id' })
  @ApiResponse({ status: 200, description: 'Charge head fetched successfully' })
  @ApiResponse({ status: 404, description: 'Charge head not found' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  @ApiParam({ name: 'id', description: "Charge head id" })
  findOne(@Param('id') id: string) {
    return this.chargeHeadsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update charge head' })
  @ApiResponse({ status: 200, description: 'Charge head updated successfully' })
  @ApiResponse({ status: 404, description: 'Charge head not found' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  @ApiParam({ name: 'id', description: "Charge head id" })
  @UseInterceptors(TransactionInterceptor)
  update(@Param('id') id: string, @Body() updateChargeHeadDto: UpdateChargeHeadDto) {
    return this.chargeHeadsService.update(id, updateChargeHeadDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete charge head' })
  @ApiResponse({ status: 200, description: 'Charge head deleted successfully' })
  @ApiResponse({ status: 404, description: 'Charge head not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete mandatory charge head' })
  @CheckAbilities({ subject: Role.ADMIN, action: Action.DELETE })
  @ApiParam({ name: 'id', description: "Charge head id" })
  remove(@Param('id') id: string) {
    return this.chargeHeadsService.remove(id);
  }
}
