import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Task } from "./entities/task.entity";
import { ETask } from "src/common/types/global.type";

@Injectable()
export class TasksCron {
    constructor(
        @InjectRepository(Task) private taskRepo: Repository<Task>,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async removeExpiredHomeworks() { // remove homeworks which has createdAt date is older than 7 days
        console.log('Removing expired homeworks...');
        
        const expiredHomeworks = await this.taskRepo.createQueryBuilder('task')
            .where("task.taskType = :taskType", { taskType: ETask.HOMEWORK })
            .andWhere("DATE(task.createdAt) < DATE_SUB(CURRENT_DATE(), INTERVAL 1 WEEK)")
            .getMany();

        await this.taskRepo.remove(expiredHomeworks);
    }

}