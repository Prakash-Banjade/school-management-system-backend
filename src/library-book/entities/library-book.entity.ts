import { BaseEntity } from "src/core/entities/base.entity";
import { Column, Entity, OneToOne } from "typeorm";
import { LibraryBookRequest } from "./library-book-request.entity";

@Entity()
export class LibraryBook extends BaseEntity {
    @Column({ type: 'varchar' })
    bookCode: string;

    @Column({ type: 'varchar' })
    bookName: string;

    @Column({ type: 'varchar', default: '' })
    publisherName: string;

    @Column({ type: 'boolean', default: true })
    available: boolean;

    @OneToOne(() => LibraryBookRequest, libraryBookRequest => libraryBookRequest.libraryBook)
    libraryBookRequest: LibraryBookRequest;
}
