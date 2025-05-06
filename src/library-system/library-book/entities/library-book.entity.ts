import { Column, Entity, ManyToOne, OneToMany, OneToOne } from "typeorm";
import { BaseEntity } from "src/common/entities/base.entity";
import { BookTransaction } from "src/library-system/book-transactions/entities/book-transaction.entity";
import { BookCategory } from "src/library-system/book-categories/entities/book-category.entity";
import { Branch } from "src/branches/entities/branch.entity";
import { File } from "src/file-management/files/entities/file.entity";
import { Image } from "src/file-management/images/entities/image.entity";

@Entity()
export class LibraryBook extends BaseEntity {
    @Column({ type: 'varchar' })
    bookCode: string;

    @Column({ type: 'varchar' })
    bookName: string;

    @OneToOne(() => Image, (image) => image.libraryBookCoverImage, { onDelete: 'SET NULL', cascade: true, nullable: true })
    coverImage: Image | null;

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

    @OneToMany(() => File, (file) => file.libraryBook, { cascade: true })
    documents: File[];

    @OneToMany(() => BookTransaction, (bookTransaction) => bookTransaction.book)
    transactions: BookTransaction[];

    @ManyToOne(() => BookCategory, (bookCategory) => bookCategory.books, { onDelete: 'RESTRICT' })
    category: BookCategory;

    @ManyToOne(() => Branch, (branch) => branch.libraryBooks, { onDelete: 'CASCADE' })
    branch: Branch;
}
