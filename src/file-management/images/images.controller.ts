import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Res } from '@nestjs/common';
import { ImagesService } from './images.service';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FormDataRequest } from 'nestjs-form-data';
import { SkipThrottle } from '@nestjs/throttler';
import { ImageQueryDto } from './dto/image-query.dto';
import { Action, AuthUser } from 'src/common/types/global.type';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { QueryDto } from 'src/common/dto/query.dto';
import { Public } from 'src/common/decorators/setPublicRoute.decorator';
import { FastifyReply } from 'fastify';
import { ChekcAbilities } from 'src/common/decorators/abilities.decorator';

@ApiTags('Upload Images')
@Controller('upload/images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) { }

  @Post()
  @ApiBearerAuth()
  @FormDataRequest({ limits: { fileSize: 5 * 1024 * 1024, files: 10 } })
  @ApiOperation({ description: 'Upload Images' })
  @ApiConsumes('multipart/formdata')
  upload(@Body() createImageDto: CreateImageDto, @CurrentUser() currentUser: AuthUser) {
    return this.imagesService.upload(createImageDto, currentUser);
  }

  @Get()
  @ApiBearerAuth()
  findAll(@Query() queryDto: QueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.imagesService.findAll(queryDto, currentUser);
  }

  @Public()
  @Get('get-image/:slug')
  @SkipThrottle()
  getImage(@Param("slug") slug: string, @Query() queryDto: ImageQueryDto, @Res() res: FastifyReply, @CurrentUser() currentUser?: AuthUser) {
    return this.imagesService.serveImage(slug, queryDto, res);
  }

  // @Get(':id')
  // findOne(@Param('id') id: string, @Res() res: Response) {
  //   return this.imagesService.findOne(id);
  // }

  @Patch(':id')
  @ApiBearerAuth()
  @FormDataRequest()
  @ApiConsumes('multipart/formdata')
  @ChekcAbilities({ subject: 'all', action: Action.UPDATE })
  update(@Param('id') id: string, @Body() updateImageDto: UpdateImageDto) {
    return this.imagesService.update(id, updateImageDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ChekcAbilities({ subject: 'all', action: Action.DELETE })
  remove(@Param('id') id: string) {
    return this.imagesService.remove(id);
  }
}
