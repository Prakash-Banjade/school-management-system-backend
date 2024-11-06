import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateTransportRouteDto } from './dto/create-transport-route.dto';
import { TransportRoutesService } from './transport-routes.service';
import { UpdateTransportRouteDto } from './dto/update-transport-route.dto';
import { QueryDto } from 'src/common/dto/query.dto';

@ApiBearerAuth()
@ApiTags('Transport Routes')
@Controller('transport-rotues')
export class TransportRoutesController {
  constructor(private readonly transportRoutesService: TransportRoutesService) { }

  @Post()
  create(@Body() createTransportRouteDto: CreateTransportRouteDto) {
    return this.transportRoutesService.create(createTransportRouteDto);
  }

  @Get()
  findAll(@Query() queryDto: QueryDto) {
    return this.transportRoutesService.findAll(queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transportRoutesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTransportRouteDto: UpdateTransportRouteDto) {
    return this.transportRoutesService.update(id, updateTransportRouteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transportRoutesService.remove(id);
  }
}
