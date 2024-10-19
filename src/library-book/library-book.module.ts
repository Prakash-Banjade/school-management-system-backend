import { Module } from '@nestjs/common';
import { LibraryBookService } from './library-book.service';
import { LibraryBookController } from './library-book.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibraryBook } from './entities/library-book.entity';
import { LibraryBookRequest } from './entities/library-book-request.entity';
import { UsersModule } from 'src/users/users.module';
import { LibraryBookRequestService } from './library-requests.service';
import { LibraryBookRequestController } from './library-requests.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LibraryBook,
      LibraryBookRequest,
    ]),
    UsersModule,
  ],
  controllers: [LibraryBookController, LibraryBookRequestController],
  providers: [LibraryBookService, LibraryBookRequestService],
})
export class LibraryBookModule { }
