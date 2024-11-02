import { Injectable, NotFoundException, Res } from '@nestjs/common';
import { CreateFileDto } from './dto/create-files.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { File } from './entities/file.entity';
import { In, Repository } from 'typeorm';
import path from 'path';
import fs from 'fs';
import { fileSelectColumns } from './entities/file-select-cols.config';
import { UpdateFileDto } from './dto/update-files.dto';
import { getFileMetadata } from 'src/utils/getFileMetadata';
import { QueryDto } from 'src/common/dto/query.dto';
import { applySelectColumns } from 'src/utils/apply-select-cols';
import paginatedData from 'src/utils/paginatedData';
import { FastifyReply } from 'fastify';
import { EFileMimeType } from 'src/common/types/global.type';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File) private filesRepository: Repository<File>,
  ) { }

  async upload(createFileDto: CreateFileDto) {

    const files: File[] = await Promise.all(createFileDto?.files.map(async (uploadFile) => {
      const metaData = await getFileMetadata(uploadFile);

      return this.filesRepository.create({
        ...metaData,
        name: createFileDto.name || metaData.originalName,
      });
    }));

    await this.filesRepository.save(files);

    return {
      message: 'File(s) Uploaded',
      count: createFileDto.files.length,
      files: files.map(file => ({ id: file.id, url: file.url, originalName: file.originalName }))
    }
  }

  async findAll(queryDto: QueryDto) {
    const queryBuilder = this.filesRepository.createQueryBuilder('file');

    queryBuilder
      .orderBy('file.createdAt', 'DESC')
      .skip(queryDto.skip)
      .take(queryDto.take)

    applySelectColumns(queryBuilder, fileSelectColumns, 'file');

    return paginatedData(queryDto, queryBuilder);
  }

  async findAllByIds(ids: string[], mimeType?: EFileMimeType) {
    return await this.filesRepository.find({
      where: [
        { id: In(ids), mimeType: mimeType },
        { url: In(ids), mimeType: mimeType }
      ]
    })
  }

  async findOne(id: string) {
    const existingFile = await this.filesRepository.findOne({
      where: [
        { id },
        { url: id }
      ],
    });
    if (!existingFile) throw new NotFoundException('File not found');

    return existingFile
  }

  async serveFile(filename: string, @Res() res: FastifyReply) {
    const filePath = path.join(process.cwd(), 'public', filename);

    fs.stat(filePath, (err, stats) => {
      if (err) {
        if (err.code === 'ENOENT') {
          throw new NotFoundException('File not found');
        } else {
          throw new Error(err.message);
        }
      }

      const contentTypeFormat = path.extname(filename).substring(1) === 'pdf' ? 'application/pdf' : 'image/' + path.extname(filename).substring(1);

      // Set appropriate headers
      res.header('Content-Type', contentTypeFormat);
      res.header('Content-Length', stats.size);

      // Stream the file to the response
      const readStream = fs.createReadStream(filePath);

      readStream.on('data', (chunk) => {
        res.raw.write(chunk);
      });

      // End the response once the stream has finished
      readStream.on('end', () => {
        res.raw.end();
      });
    });
  }

  async update(id: string, updateFileDto: UpdateFileDto) {
    const existing = await this.findOne(id);

    // update file name only
    existing.name = updateFileDto.name;

    const savedFile = await this.filesRepository.save(existing);

    return {
      message: 'File updated',
      file: {
        url: savedFile.url,
        id: savedFile.id
      }
    }
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    await this.filesRepository.remove(existing);
    return {
      message: 'File deleted successfully'
    }
  }
}
