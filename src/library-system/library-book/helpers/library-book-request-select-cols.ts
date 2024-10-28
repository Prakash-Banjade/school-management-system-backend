import { FindOptionsSelect } from "typeorm";
import { LibraryBook } from "../entities/library-book.entity";

export const libraryBookRequestSelectCols: FindOptionsSelect<LibraryBook> = {
    id: true,
    createdAt: true,
    bookCode: true,
    bookName: true,
    publisherName: true,
    description: true,
    publicationYear: true,
    copiesCount: true,
    issuedCount: true,
}