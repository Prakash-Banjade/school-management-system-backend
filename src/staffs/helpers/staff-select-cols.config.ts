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
    joinedDate: true,
    createdAt: true,
    account: {
        id: true,
        profileImage: {
            id: true,
            url: true
        },
    },
    faculties: {
        id: true,
        name: true,
    }
}