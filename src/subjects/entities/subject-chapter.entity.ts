import { Column, Entity, ManyToOne } from "typeorm";
import { Subject } from "./subject.entity";
import { ESubjectChapterPriority } from "src/common/types/global.type";
import { BaseEntity } from "src/common/entities/base.entity";

@Entity()
export class SubjectChapter extends BaseEntity {
    @Column({ type: 'int' })
    chapterNo: number

    @Column({ type: 'varchar' })
    title: string

    @Column({ type: 'longtext' })
    content: string;

    @Column({ type: 'enum', enum: ESubjectChapterPriority, default: ESubjectChapterPriority.MEDIUM })
    priority: ESubjectChapterPriority;

    @ManyToOne(() => Subject, subject => subject.chapters, { onDelete: 'CASCADE' })
    subject: Subject
}