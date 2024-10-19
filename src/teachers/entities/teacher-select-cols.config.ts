import { FindOptionsSelect } from "typeorm";
import { Teacher } from "./teacher.entity";

export const teachersColumnsConfig: FindOptionsSelect<Teacher> = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    dob: true,
    gender: true,
    createdAt: true,
    profileImage: {
        id: true,
        url: true
    },
    account: {
        id: true,
        user: {
            id: true,
        }
    }
}