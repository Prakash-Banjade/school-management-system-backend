import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Student } from 'src/students/entities/student.entity';
import { LibraryBook } from 'src/library-system/library-book/entities/library-book.entity';
import { LedgerItem } from 'src/finance-system/fee-management/student-ledgers/entities/ledger-item.entity';

@Entity()
export class BookTransaction extends BaseEntity {
    @ManyToOne(() => LibraryBook, (libraryBook) => libraryBook.transactions, { onDelete: 'CASCADE' })
    book: LibraryBook;

    @ManyToOne(() => Student, (student) => student.bookTransactions, { onDelete: 'CASCADE' })
    student: Student;

    @Column({ type: 'datetime' })
    dueDate: string;

    @Column({ nullable: true, type: 'datetime' })
    returnedAt: string | null;

    @Column({ type: 'simple-array' })
    renewals: string[];

    @Column({ type: 'float', default: 0 })
    fine: number;

    @Column({ type: 'datetime', nullable: true })
    paidAt: string;

    @ManyToOne(() => LedgerItem, ledgerItem => ledgerItem.bookTransactions, { onDelete: 'SET NULL', nullable: true })
    ledgerItem: LedgerItem;
}
