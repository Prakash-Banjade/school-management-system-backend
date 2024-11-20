import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ChargeHeadsService } from './charge-heads.service';
import { CreateChargeHeadDto } from './dto/create-charge-head.dto';
import { UpdateChargeHeadDto } from './dto/update-charge-head.dto';
import { QueryDto } from 'src/common/dto/query.dto';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChargeHeadOptionsQueryDto } from './dto/charge-head-query.dto';

@ApiBearerAuth()
@ApiTags('Charge Heads')
@Controller('charge-heads')
export class ChargeHeadsController {
  constructor(private readonly chargeHeadsService: ChargeHeadsService) { }

  @Post()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  create(@Body() createChargeHeadDto: CreateChargeHeadDto) {
    return this.chargeHeadsService.create(createChargeHeadDto);
  }

  @Get()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAll(@Query() queryDto: QueryDto) {
    return this.chargeHeadsService.findAll(queryDto);
  }

  @Get('options')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getOptions(@Query() queryDto: ChargeHeadOptionsQueryDto) {
    return this.chargeHeadsService.getOptions(queryDto);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.chargeHeadsService.findOne(id);
  }

  @Patch(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  update(@Param('id') id: string, @Body() updateChargeHeadDto: UpdateChargeHeadDto) {
    return this.chargeHeadsService.update(id, updateChargeHeadDto);
  }

  @Delete(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.DELETE })
  remove(@Param('id') id: string) {
    return this.chargeHeadsService.remove(id);
  }
}
