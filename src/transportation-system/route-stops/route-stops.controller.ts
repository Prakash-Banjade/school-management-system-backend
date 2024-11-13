import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RouteStopsService } from './route-stops.service';
import { CreateRouteStopDto } from './dto/create-route-stop.dto';
import { UpdateRouteStopDto } from './dto/update-route-stop.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { RouteStopQueryDto } from './dto/route-stop-query.dto';

@ApiBearerAuth()
@ApiTags('Route Stops')
@Controller('route-stops')
export class RouteStopsController {
  constructor(private readonly routeStopsService: RouteStopsService) { }

  @Post()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  create(@Body() createRouteStopDto: CreateRouteStopDto) {
    return this.routeStopsService.create(createRouteStopDto);
  }

  @Get()
  @CheckAbilities({ subject: Role.USER, action: Action.READ })
  findAll(@Query() queryDto: RouteStopQueryDto) {
    return this.routeStopsService.findAll(queryDto);
  }

  @Get('options')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  getOptions(@Query() queryDto: RouteStopQueryDto) {
    return this.routeStopsService.getOptions(queryDto);
  }

  @Get(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.routeStopsService.findOne(id);
  }

  @Patch(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
  update(@Param('id') id: string, @Body() updateRouteStopDto: UpdateRouteStopDto) {
    return this.routeStopsService.update(id, updateRouteStopDto);
  }

  @Delete(':id')
  @CheckAbilities({ subject: Role.ADMIN, action: Action.DELETE })
  remove(@Param('id') id: string) {
    return this.routeStopsService.remove(id);
  }
}
