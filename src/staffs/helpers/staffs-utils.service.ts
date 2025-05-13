import { Injectable } from "@nestjs/common";
import { Staff } from "../entities/staff.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class StaffUtilsService {
    constructor(
        @InjectRepository(Staff) private readonly staffRepo: Repository<Staff>
    ) { }

    async generateStaffId() {
        const currentYear = new Date().getFullYear();

        const lastStaff = await this.staffRepo
            .createQueryBuilder('staff')
            .orderBy('staff.createdAt', 'DESC')
            .limit(1)
            .select(['staff.id', 'staff.staffId'])
            .getOne();

        if (!lastStaff || !lastStaff.staffId) {
            return `STAFF-${currentYear}-00001`;
        }

        const lastStaffIdParts = lastStaff.staffId?.split('-');
        const lastYear = parseInt(lastStaffIdParts[1], 10);
        const lastCounter = parseInt(lastStaffIdParts[2], 10);

        if (lastYear !== currentYear) {
            return `STAFF-${currentYear}-00001`; // Reset counter if the year has changed
        }

        const newCounter = (lastCounter + 1).toString().padStart(5, '0');
        return `STAFF-${currentYear}-${newCounter}`;
    }
}