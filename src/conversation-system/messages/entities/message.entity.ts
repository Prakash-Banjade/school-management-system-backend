import { Account } from "src/auth-system/accounts/entities/account.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { Conversation } from "src/conversation-system/conversation/entities/conversation.entity";
import { Entity, Column, ManyToOne } from "typeorm";

@Entity({
    name: "conversation_message"
})
export class Message extends BaseEntity {
    @Column({ type: "text" })
    content: string;

    @ManyToOne(() => Conversation, (conversation) => conversation.messages, { onDelete: "CASCADE" })
    conversation: Conversation;

    @ManyToOne(() => Account, (account) => account.messages, { nullable: false })
    sender: Account;

    // Optional: Add 'readBy' logic here or in a separate table if read-receipts need to be exact per user
}