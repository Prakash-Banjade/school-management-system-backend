import { ClassRoom } from "src/class-rooms/entities/class-room.entity";
import { Teacher } from "src/teachers/entities/teacher.entity";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { SubjectChapter } from "./subject-chapter.entity";
import { Task } from "src/tasks/entities/task.entity";
import { ClassRoutine } from "src/class-routines/entities/class-routine.entity";
import { ExamSubject } from "src/examination-system/exam-subjects/entities/exam-subject.entity";
import { BaseEntity } from "src/common/entities/base.entity";

@Entity()
export class Subject extends BaseEntity {
    @Column({ type: 'varchar' })
    subjectName: string;

    @Column({ type: 'varchar', unique: true })
    subjectCode: string;

    @Column({ type: 'longtext' })
    content: string;

    @Column({ type: 'int' })
    theoryPM: number;

    @Column({ type: 'int' })
    theoryFM: number;

    @Column({ type: 'int' })
    practicalPM: number;
    
    @Column({ type: 'int' })
    practicalFM: number;

    /**
    |--------------------------------------------------
    | RELATIONS
    |--------------------------------------------------
    */

    @ManyToOne(() => Teacher, teacher => teacher.assignedSubjects, { onDelete: 'SET NULL', nullable: true })
    teacher: Teacher;

    @ManyToOne(() => ClassRoom, classRoom => classRoom.subjects, { onDelete: 'SET NULL', nullable: true })
    classRoom: ClassRoom;

    @OneToMany(() => SubjectChapter, chapter => chapter.subject)
    chapters: SubjectChapter[];

    @OneToMany(() => Task, (task) => task.subject)
    tasks: Task[]

    @OneToMany(() => ClassRoutine, classRoutine => classRoutine.subject)
    classRoutines: ClassRoutine[]

    @OneToMany(() => ExamSubject, examSubject => examSubject.subject)
    examSubjects: ExamSubject[]
}
