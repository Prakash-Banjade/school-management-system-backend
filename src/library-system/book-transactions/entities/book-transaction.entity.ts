import { Entity, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Student } from 'src/students/entities/student.entity';
import { LibraryBook } from 'src/library-system/library-book/entities/library-book.entity';

@Entity()
export class BookTransaction extends BaseEntity {
    @ManyToOne(() => LibraryBook, (libraryBook) => libraryBook.transactions, { onDelete: 'CASCADE' })
    book: LibraryBook;

    @ManyToOne(() => Student, (student) => student.bookTransactions, { onDelete: 'CASCADE' })
    student: Student;

    @Column({ nullable: true, type: 'datetime' })
    returnedAt: Date | null;
}
