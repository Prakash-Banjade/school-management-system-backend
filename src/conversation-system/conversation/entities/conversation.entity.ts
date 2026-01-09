import { BaseEntity } from "src/common/entities/base.entity";
import { Message } from "src/conversation-system/messages/entities/message.entity";
import { Student } from "src/students/entities/student.entity";
import { Teacher } from "src/teachers/entities/teacher.entity";
import { Entity, ManyToOne, OneToMany, Unique } from "typeorm";

@Entity()
@Unique(['teacher', 'student'])
export class Conversation extends BaseEntity {
    @ManyToOne(() => Teacher, teacher => teacher.conversations, { onDelete: 'CASCADE', nullable: false })
    teacher: Teacher;

    @ManyToOne(() => Student, student => student.conversations, { onDelete: 'CASCADE', nullable: false })
    student: Student;

    @OneToMany(() => Message, (message) => message.conversation)
    messages: Message[]
}