import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { LibraryBook } from 'src/library-system/library-book/entities/library-book.entity';

@Entity('book_categories')
export class BookCategory extends BaseEntity {

    @Column({ unique: true })
    name: string;

    @OneToMany(() => LibraryBook, (libraryBook) => libraryBook.category) 
    books: LibraryBook[];
}
