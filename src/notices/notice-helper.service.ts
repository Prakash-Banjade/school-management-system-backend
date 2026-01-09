import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Account } from "src/auth-system/accounts/entities/account.entity";
import { Role } from "src/common/types/global.type";
import { NoticeEventDto } from "src/mail/dto/events.dto";
import { MailEvents } from "src/mail/mail.service";
import { Repository } from "typeorm";

@Injectable()
export class NoticeHelperService {

    constructor(
        @InjectRepository(Account) private readonly accountRepo: Repository<Account>,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    /**
     * @dev should use queue to send mail, fetch users on batch (pagination) instead of all at once, fix later
     * @param subject 
     * @param noticeContent 
     */
    async sendMail(subject: string, noticeContent: string) {
        const recipients: { email: string }[] = await this.accountRepo.createQueryBuilder('account')
            .where('account.role != :role', { role: Role.SUPER_ADMIN })
            .select('account.email', 'email')
            .getRawMany();

        // send mail
        this.eventEmitter.emit(MailEvents.NOTICE, new NoticeEventDto({
            recipients: recipients.map((recipient) => recipient.email),
            noticeContent,
            subject
        }));
    }
}
