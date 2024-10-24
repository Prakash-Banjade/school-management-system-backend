import { FindOptionsSelect } from "typeorm";
import { Staff } from "../entities/staff.entity";

export const staffsColumnsConfig: FindOptionsSelect<Staff> = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    staffId: true,
    type: true,
    dob: true,
    gender: true,
    createdAt: true,
    profileImage: {
        id: true,
        url: true
    },
    account: {
        id: true,
    }
}