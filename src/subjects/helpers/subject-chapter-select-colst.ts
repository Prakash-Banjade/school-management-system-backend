import { FindOptionsSelect } from "typeorm";
import { SubjectChapter } from "../entities/subject-chapter.entity";

export const subjectChapterSelectCols: FindOptionsSelect<SubjectChapter> = {
    id: true,
    title: true,
    chapterNo: true,
    priority: true,
    createdAt: true,
    content: true,
    updatedAt: true,
}