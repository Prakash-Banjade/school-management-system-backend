import { Account } from "src/auth-system/accounts/entities/account.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { Conversation } from "src/conversation-system/conversation/entities/conversation.entity";
import { Entity, ManyToOne, Column, Unique } from "typeorm";

@Entity()
@Unique(["conversation", "account"]) // User can't be in same chat twice
export class ConversationParticipant extends BaseEntity {
    @ManyToOne(() => Conversation, (conversation) => conversation.participants, { onDelete: "CASCADE" })
    conversation: Conversation;

    @ManyToOne(() => Account, (account) => account.conversations, { onDelete: "CASCADE" })
    account: Account;

    @Column({ type: 'integer', default: 0 })
    unreadCount: number;

    // Useful to disable chat if a student leaves the school/class
    @Column({ type: 'boolean', default: true })
    isActive: boolean;
}