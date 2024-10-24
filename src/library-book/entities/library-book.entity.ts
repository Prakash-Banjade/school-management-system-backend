import { Column, Entity, OneToMany, OneToOne } from "typeorm";
import { LibraryBookRequest } from "./library-book-request.entity";
import { BaseEntity } from "src/common/entities/base.entity";

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

    @OneToMany(() => LibraryBookRequest, libraryBookRequest => libraryBookRequest.libraryBook)
    libraryBookRequest: LibraryBookRequest;
}
