import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from "typeorm";
import { LibraryBook } from "./library-book.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { ELibarryBookStatus } from "src/common/types/global.type";

@Entity()
export class LibraryBookRequest extends BaseEntity {
    @OneToOne(() => LibraryBook, libraryBook => libraryBook.libraryBookRequest)
    @JoinColumn({ name: 'library_book_id' })
    libraryBook: LibraryBook;

    @Column({ type: 'datetime' })
    requestDate: string;

    @Column({ type: 'enum', enum: ELibarryBookStatus, default: ELibarryBookStatus.PENDING })
    status: ELibarryBookStatus

    @ManyToOne(() => User, user => user.libraryBookRequests, { onDelete: 'RESTRICT' })
    user: User;
}