import { FindOptionsSelect } from "typeorm";
import { LibraryBook } from "../entities/library-book.entity";

export const libraryBookSelectCols: FindOptionsSelect<LibraryBook> = {
    id: true,
    createdAt: true,
    bookCode: true,
    bookName: true,
    publisherName: true,
    description: true,
    publicationYear: true,
    category: {
        id: true,
        name: true,
    },
    documents: {
        id: true,
        url: true,
        originalName: true,
        size: true,
        format: true,
    },
    coverImage: {
        id: true,
        url: true,
        originalName: true,
    }
}