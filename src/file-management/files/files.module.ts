import { Global, Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from './entities/file.entity';
import { FilesCron } from './files.cron';

Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      File,
    ]),
  ],
  controllers: [FilesController],
  providers: [FilesService, FilesCron],
  exports: [FilesService],
})
export class FilesModule { }
