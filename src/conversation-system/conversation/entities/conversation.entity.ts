import { Entity, Column, OneToMany, ManyToOne, JoinColumn, Index } from "typeorm";
import { EConversationType } from "../interfaces";
import { ClassRoom } from "src/class-rooms/entities/class-room.entity";
import { Subject } from "src/subjects/entities/subject.entity";
import { ConversationParticipant } from "src/conversation-system/conversation-participants/entities/conversation-participant.entity";
import { Message } from "src/conversation-system/messages/entities/message.entity";
import { BaseEntity } from "src/common/entities/base.entity";

@Entity()
@Index(["classRoom", "subject"], { unique: true, where: "type = 'GROUP'" }) // Ensures only 1 group per Subject per Class
export class Conversation extends BaseEntity {
    @Column({ type: "enum", enum: EConversationType })
    type: EConversationType;

    // Optional: Only used if type === GROUP to identify the context
    @ManyToOne(() => ClassRoom, { nullable: true })
    @JoinColumn()
    classRoom: ClassRoom;

    @ManyToOne(() => Subject, { nullable: true })
    @JoinColumn()
    subject: Subject;

    @Column({ type: "varchar", nullable: true })
    title: string; // E.g., "Class 2 - English" (Can be auto-generated)

    @OneToMany(() => ConversationParticipant, (participant) => participant.conversation, { cascade: true })
    participants: ConversationParticipant[];

    @OneToMany(() => Message, (message) => message.conversation)
    messages: Message[];

    @Column({ type: "varchar", default: "", nullable: true })
    lastMessageContent: string; // For UI preview

    @Column({ type: "timestamp", nullable: true })
    lastMessageAt: Date; // For sorting
}