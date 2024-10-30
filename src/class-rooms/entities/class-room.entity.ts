import { BadRequestException } from "@nestjs/common";
import { ClassRoutine } from "src/class-routines/entities/class-routine.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { EClassType } from "src/common/types/global.type";
import { Enrollment } from "src/enrollments/entities/enrollment.entity";
import { Exam } from "src/examination-system/exams/entities/exam.entity";
import { FeesGroup } from "src/finance-system/fees-system/fees-groups/entities/fees-group.entity";
import { Student } from "src/students/entities/student.entity";
import { Subject } from "src/subjects/entities/subject.entity";
import { Task } from "src/tasks/entities/task.entity";
import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToMany, OneToMany, Tree, TreeChildren, TreeParent } from "typeorm";

@Entity()
@Tree("closure-table", {
    closureTableName: "classRooms_closure",
    ancestorColumnName: (column) => "ancestor_" + column.propertyName,
    descendantColumnName: (column) => "descendant_" + column.propertyName,
})
export class ClassRoom extends BaseEntity {
    @Column({ type: "varchar" })
    name: string;

    @Column({ type: "longtext", nullable: true })
    description: string;

    @Column({ type: "real" })
    monthlyTutionFee: number;

    @Column({ type: "real" })
    monthlyFee: number;

    @Column({ type: 'varchar', default: '' })
    location: string

    @TreeChildren()
    children: ClassRoom[];

    @TreeParent({ onDelete: "CASCADE" })
    parent: ClassRoom;

    @Column({ type: "enum", enum: EClassType, default: EClassType.PRIMARY })
    classType: EClassType

    @BeforeInsert()
    @BeforeUpdate()
    checkForTypeAndParent() {
        if (this.parent && (this.parent.classType === EClassType.SECTION)) {
            throw new BadRequestException(`Class type of ${this.parent.classType} cannot have children class.`)
        }
        if (this.classType === this.parent?.classType) {
            throw new BadRequestException(`Class type of ${this.classType} cannot have parent class of same type.`)
        }
    }

    @OneToMany(() => Enrollment, (enrollment) => enrollment.classRoom)
    enrollments: Enrollment[]

    @OneToMany(() => Student, (student) => student.classRoom)
    students: Student[]

    @OneToMany(() => Subject, (subject) => subject.classRoom)
    subjects: Subject[]

    @ManyToMany(() => Task, (task) => task.classRooms)
    tasks: Task[]

    @OneToMany(() => FeesGroup, (feesGroup) => feesGroup.classRoom)
    feesGroups: FeesGroup[]

    @OneToMany(() => ClassRoutine, (classRoutine) => classRoutine.classRoom)
    classRoutines: ClassRoutine[]

    @OneToMany(() => Exam, exam => exam.classRoom)
    exams: Exam[]
}
