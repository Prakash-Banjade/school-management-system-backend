import { Account } from "src/auth-system/accounts/entities/account.entity";
import { Conversation } from "src/conversation-system/conversation/entities/conversation.entity";
import { Column, ManyToOne } from "typeorm";

export class Message {
    @ManyToOne(() => Conversation, conversation => conversation.messages, { onDelete: 'CASCADE', nullable: false })
    conversation: Conversation;

    @Column({ type: 'longtext' })
    content: string;

    @ManyToOne(() => Account, account => account.conversationMessages, { onDelete: 'CASCADE', nullable: false })
    sender: Account;

    @Column({ type: 'json', nullable: true })
    seenAt: { teacher: Date | null, student: Date | null } | null;
}
