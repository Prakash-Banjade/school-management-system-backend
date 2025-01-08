import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LeaveRequest } from "./entities/leave-request.entity";
import { Repository } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export class LeaveRequestsCron {
    constructor(
        @InjectRepository(LeaveRequest) private readonly leaveRequestRepo: Repository<LeaveRequest>,
    ) { }

    // remove leave request which has leaveTo date less than 7 days from today
    @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
    async removeExpiredLeaveRequests() {
        console.log('Removing expired leave requests...')

        return this.leaveRequestRepo.createQueryBuilder()
            .delete()
            .where('DATE(leaveTo) < DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY)')
            .execute();
    }
}