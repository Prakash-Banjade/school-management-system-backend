import { BaseEntity } from "src/common/entities/base.entity";
import { Student } from "src/students/entities/student.entity";
import { LessonPlan } from "src/lesson-plans/entities/lesson-plan.entity";
import { TaskSubmission } from "src/task-system/task-submissions/entities/task-submission.entity";
import { Task } from "src/task-system/tasks/entities/task.entity";
import { Column, Entity, Index, ManyToOne } from "typeorm";
import { LibraryBook } from "src/library-system/library-book/entities/library-book.entity";
import { Teacher } from "src/teachers/entities/teacher.entity";
import { Staff } from "src/staffs/entities/staff.entity";

@Entity()
export class File extends BaseEntity {
    @Index({ unique: true })
    @Column({ type: 'varchar' })
    url!: string

    @Column({ type: 'varchar' })
    mimeType!: string

    @Column({ type: 'varchar' })
    format!: string

    @Column({ type: 'int' })
    size!: number

    @Column({ type: 'varchar' })
    originalName!: string

    @Column({ type: 'varchar', default: '' })
    name!: string

    /**
    |--------------------------------------------------
    | RELATIONS
    |--------------------------------------------------
    */

    @ManyToOne(() => Student, student => student.documentAttachments, { onDelete: 'CASCADE' })
    student_documentAttachment: Student;

    @ManyToOne(() => Teacher, teacher => teacher.documentAttachments, { onDelete: 'CASCADE' })
    teacher_documentAttachment: Teacher;

    @ManyToOne(() => Staff, staff => staff.documentAttachments, { onDelete: 'CASCADE' })
    staff_documentAttachment: Staff;

    @ManyToOne(() => Task, task => task.attachments, { onDelete: 'CASCADE' })
    task_attachment: Task;

    @ManyToOne(() => TaskSubmission, taskSubmission => taskSubmission.attachments, { onDelete: 'CASCADE' })
    task_submission_attachment: TaskSubmission;

    @ManyToOne(() => LessonPlan, lessonPlan => lessonPlan.attachments, { onDelete: 'CASCADE' })
    lessonPlan_attachment: LessonPlan;

    @ManyToOne(() => LibraryBook, libraryBook => libraryBook.documents, { onDelete: 'CASCADE' })
    libraryBook: LibraryBook;
}
