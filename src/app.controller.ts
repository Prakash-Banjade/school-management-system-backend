import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from './common/decorators/setPublicRoute.decorator';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // @Public()
  // @Post('seed')
  // seed() {
  //   return this.appService.seed();
  // }
}
