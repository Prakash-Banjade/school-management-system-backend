import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RouteStopsService } from './route-stops.service';
import { CreateRouteStopDto } from './dto/create-route-stop.dto';
import { UpdateRouteStopDto } from './dto/update-route-stop.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChekcAbilities } from 'src/common/decorators/abilities.decorator';
import { Action } from 'src/common/types/global.type';
import { RouteStopQueryDto } from './dto/route-stop-query.dto';

@ApiBearerAuth()
@ApiTags('Route Stops')
@Controller('route-stops')
export class RouteStopsController {
  constructor(private readonly routeStopsService: RouteStopsService) { }

  @Post()
  @ChekcAbilities({ subject: 'all', action: Action.CREATE })
  create(@Body() createRouteStopDto: CreateRouteStopDto) {
    return this.routeStopsService.create(createRouteStopDto);
  }

  @Get()
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  findAll(@Query() queryDto: RouteStopQueryDto) {
    return this.routeStopsService.findAll(queryDto);
  }

  @Get(':id')
  @ChekcAbilities({ subject: 'all', action: Action.READ })
  findOne(@Param('id') id: string) {
    return this.routeStopsService.findOne(id);
  }

  @Patch(':id')
  @ChekcAbilities({ subject: 'all', action: Action.UPDATE })
  update(@Param('id') id: string, @Body() updateRouteStopDto: UpdateRouteStopDto) {
    return this.routeStopsService.update(id, updateRouteStopDto);
  }

  @Delete(':id')
  @ChekcAbilities({ subject: 'all', action: Action.DELETE })
  remove(@Param('id') id: string) {
    return this.routeStopsService.remove(id);
  }
}
