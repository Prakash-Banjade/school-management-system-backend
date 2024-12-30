import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository } from "typeorm";
import { BookTransaction } from "./entities/book-transaction.entity";
import { Cron, CronExpression } from "@nestjs/schedule";
import { differenceInDays, startOfDay } from "date-fns";
import { GeneralSetting } from "src/general-settings/entities/general-setting.entity";

@Injectable()
export class BookTransactionsCron {
    constructor(
        @InjectRepository(BookTransaction) private bookTransactionRepo: Repository<BookTransaction>,
        @InjectRepository(GeneralSetting) private generalSettingsRepo: Repository<GeneralSetting>,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async calculateOverDueFines() {
        console.log('Calculating library book over due fines...');

        const overDueTransactions = await this.bookTransactionRepo.createQueryBuilder('transaction')
            .where("DATE(transaction.dueDate) < CURRENT_DATE() AND transaction.returnedAt IS NULL")
            .select([
                'transaction.id',
                'transaction.dueDate',
            ]).getMany();

        const libraryFine = (await this.generalSettingsRepo.findOne({
            where: { id: Not(IsNull()) },
        }))?.libraryFine ?? 0;

        for (const transaction of overDueTransactions) {
            const dueDays = differenceInDays(startOfDay(new Date()), startOfDay(transaction.dueDate));

            const dueAmount = dueDays * libraryFine;

            transaction.fine = dueAmount;
        }

        await this.bookTransactionRepo.save(overDueTransactions);
    }
}