import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository } from "typeorm";
import { BookTransaction } from "./entities/book-transaction.entity";
import { Cron, CronExpression } from "@nestjs/schedule";
import { GeneralSetting } from "src/general-settings/entities/general-setting.entity";
import { format } from "date-fns";

@Injectable()
export class BookTransactionsCron {
    constructor(
        @InjectRepository(BookTransaction) private bookTransactionRepo: Repository<BookTransaction>,
        @InjectRepository(GeneralSetting) private generalSettingsRepo: Repository<GeneralSetting>,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_6AM)
    async calculateOverDueFines() {
        console.log('Calculating library book over due fines...');

        const overDueTransactions = await this.bookTransactionRepo.createQueryBuilder('transaction')
            .where("DATE(transaction.dueDate) < :today AND transaction.returnedAt IS NULL", { today: format(new Date(), 'yyyy-MM-dd') })
            .select([
                'transaction.id',
                'transaction.dueDate',
                'transaction.fine',
            ]).getMany();

        const libraryFine = (await this.generalSettingsRepo.findOne({
            where: { id: Not(IsNull()) },
        }))?.libraryFine ?? 0;

        for (const transaction of overDueTransactions) {
            transaction.fine += libraryFine;
        }

        await this.bookTransactionRepo.save(overDueTransactions);
    }
}