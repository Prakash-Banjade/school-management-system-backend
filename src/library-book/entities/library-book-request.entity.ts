import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from "typeorm";
import { LibraryBook } from "./library-book.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { ELibarryBookStatus } from "src/common/types/global.type";
import { Account } from "src/auth-system/accounts/entities/account.entity";

@Entity()
export class LibraryBookRequest extends BaseEntity {
    @ManyToOne(() => LibraryBook, libraryBook => libraryBook.libraryBookRequest)
    libraryBook: LibraryBook;

    @Column({ type: 'datetime' })
    requestDate: string;

    @Column({ type: 'enum', enum: ELibarryBookStatus, default: ELibarryBookStatus.PENDING })
    status: ELibarryBookStatus;

    @ManyToOne(() => Account, account => account.libraryBookRequests, { onDelete: 'RESTRICT' })
    account: Account;
}