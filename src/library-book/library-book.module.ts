import { Module } from '@nestjs/common';
import { LibraryBookService } from './library-book.service';
import { LibraryBookController } from './library-book.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibraryBook } from './entities/library-book.entity';
import { LibraryBookRequest } from './entities/library-book-request.entity';
import { LibraryBookRequestService } from './library-requests.service';
import { LibraryBookRequestController } from './library-requests.controller';
import { AccountsModule } from 'src/auth-system/accounts/accounts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LibraryBook,
      LibraryBookRequest,
    ]),
    AccountsModule,
  ],
  controllers: [LibraryBookController, LibraryBookRequestController],
  providers: [LibraryBookService, LibraryBookRequestService],
})
export class LibraryBookModule { }
