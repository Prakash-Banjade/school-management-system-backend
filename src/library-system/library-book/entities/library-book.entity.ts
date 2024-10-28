import { Column, Entity, OneToMany, OneToOne } from "typeorm";
import { BaseEntity } from "src/common/entities/base.entity";
import { BookTransaction } from "src/library-system/book-transactions/entities/book-transaction.entity";

@Entity()
export class LibraryBook extends BaseEntity {
    @Column({ type: 'varchar' })
    bookCode: string;

    @Column({ type: 'varchar' })
    bookName: string;

    @Column({ type: 'varchar', default: '' })
    publisherName: string;

    @Column({ type: 'longtext', nullable: true })
    description: string;

    @Column({ type: 'int' })
    publicationYear: number;

    @Column({ type: 'int', default: 1 })
    copiesCount: number;

    @Column({ type: 'int', default: 0 })
    issuedCount: number;

    @OneToMany(() => BookTransaction, (bookTransaction) => bookTransaction.book)
    transactions: BookTransaction[];
}
