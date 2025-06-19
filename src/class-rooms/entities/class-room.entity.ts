import { BadRequestException } from "@nestjs/common";
import { Branch } from "src/branches/entities/branch.entity";
import { ClassRoutine } from "src/class-routines/entities/class-routine.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { EClassType } from "src/common/types/global.type";
import { Enrollment } from "src/enrollments/entities/enrollment.entity";
import { Exam } from "src/examination-system/exams/entities/exam.entity";
import { FeeStructure } from "src/finance-system/fee-management/fee-structures/entities/fee-structure.entity";
import { OptionalSubject } from "src/optional-subject/entities/optional-subject.entity";
import { Student } from "src/students/entities/student.entity";
import { Subject } from "src/subjects/entities/subject.entity";
import { LessonPlan } from "src/lesson-plans/entities/lesson-plan.entity";
import { Task } from "src/task-system/tasks/entities/task.entity";
import { Teacher } from "src/teachers/entities/teacher.entity";
import { BeforeInsert, BeforeUpdate, Column, Entity, Index, ManyToMany, ManyToOne, OneToMany, Tree, TreeChildren, TreeParent, Unique } from "typeorm";
import { Faculty } from "src/faculties/entities/faculty.entity";
import { OnlineClass } from "src/online-classes/entities/online-class.entity";

@Entity()
@Unique(["name", "faculty", "branch", "parent", "classType"])
@Tree("closure-table", {
    closureTableName: "classRooms_closure",
    ancestorColumnName: (column) => "ancestor_" + column.propertyName,
    descendantColumnName: (column) => "descendant_" + column.propertyName,
})
export class ClassRoom extends BaseEntity {
    @Index()
    @Column({ type: "varchar" })
    name: string;

    @Column({ type: 'varchar' })
    fullName: string; // full name of class room including parent class, eg: Class 1 - A

    @BeforeInsert()
    @BeforeUpdate()
    setFullName() {
        if (this.name && this.parent?.name) {
            this.fullName = `${this.parent.name} - ${this.name}`
        }

        if (this.name && this.parent === null) {
            this.fullName = `${this.name}`
        }
    }

    @Column({ type: "longtext", nullable: true })
    description: string;

    @Column({ type: 'varchar', default: '' })
    location: string

    @TreeChildren()
    children: ClassRoom[];

    @TreeParent({ onDelete: "CASCADE" })
    parent: ClassRoom;

    @ManyToOne(() => Faculty, (faculty) => faculty.classRooms, { onDelete: 'RESTRICT', nullable: false })
    faculty: Faculty

    @Column({ type: "enum", enum: EClassType, default: EClassType.PRIMARY })
    classType: EClassType

    @ManyToOne(() => Branch, branch => branch.classRooms, { onDelete: 'CASCADE' })
    branch: Branch;

    @ManyToOne(() => Teacher, teacher => teacher.assignedClassRooms, { onDelete: 'SET NULL', nullable: true })
    classTeacher: Teacher;

    @BeforeInsert()
    @BeforeUpdate()
    checkForTypeAndParent() {
        if (this.parent && (this.parent.classType === EClassType.SECTION)) {
            throw new BadRequestException(`Class type of ${this.parent.classType} cannot have children class.`)
        }
        if (this.classType && this.classType === this.parent?.classType) {
            throw new BadRequestException(`Class type of ${this.classType} cannot have parent class of same type.`)
        }
    }

    @OneToMany(() => Enrollment, (enrollment) => enrollment.classRoom)
    enrollments: Enrollment[]

    @OneToMany(() => Student, (student) => student.classRoom)
    students: Student[]

    @OneToMany(() => Subject, (subject) => subject.classRoom)
    subjects: Subject[]

    @OneToMany(() => OptionalSubject, (optionalSubject) => optionalSubject.classRoom)
    optionalSubjects: OptionalSubject[];

    @OneToMany(() => Task, (task) => task.classRoom)
    tasks: Task[]

    @OneToMany(() => ClassRoutine, (classRoutine) => classRoutine.classRoom)
    classRoutines: ClassRoutine[]

    @OneToMany(() => Exam, exam => exam.classRoom)
    exams: Exam[];

    @OneToMany(() => LessonPlan, lessonPlan => lessonPlan.classRoom)
    lessonPlans: LessonPlan[];

    @OneToMany(() => FeeStructure, feeStructure => feeStructure.classRoom, { cascade: true })
    feeStructures: FeeStructure[];

    @OneToMany(() => OnlineClass, onlineClass => onlineClass.classRoom)
    onlineClasses: OnlineClass[];
}
