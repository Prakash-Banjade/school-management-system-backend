import { Controller, Get, Post, Body, Param, Delete, Query, Res } from '@nestjs/common';
import { ImagesService } from './images.service';
import { CreateImageDto } from './dto/create-image.dto';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FormDataRequest } from 'nestjs-form-data';
import { SkipThrottle } from '@nestjs/throttler';
import { ImageQueryDto } from './dto/image-query.dto';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { QueryDto } from 'src/common/dto/query.dto';
import { Public } from 'src/common/decorators/setPublicRoute.decorator';
import { FastifyReply } from 'fastify';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';

@ApiTags('Upload Images')
@Controller('upload/images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) { }

  @Post()
  @ApiBearerAuth()
  @FormDataRequest({ limits: { fileSize: 5 * 1024 * 1024, files: 10 } })
  @ApiOperation({ description: 'Upload Images' })
  @ApiConsumes('multipart/formdata')
  @CheckAbilities({ action: Action.CREATE, subject: Role.USER })
  upload(@Body() createImageDto: CreateImageDto, @CurrentUser() currentUser: AuthUser) {
    return this.imagesService.upload(createImageDto, currentUser);
  }

  @Get()
  @ApiBearerAuth()
  @CheckAbilities({ action: Action.CREATE, subject: Role.ADMIN })
  findAll(@Query() queryDto: QueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.imagesService.findAll(queryDto, currentUser);
  }

  @Public()
  @Get('get-image/:slug')
  @SkipThrottle()
  getImage(@Param("slug") slug: string, @Query() queryDto: ImageQueryDto, @Res() res: FastifyReply) {
    return this.imagesService.serveImage(slug, queryDto, res);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.DELETE })
  remove(@Param('id') id: string) {
    return this.imagesService.remove(id);
  }
}
