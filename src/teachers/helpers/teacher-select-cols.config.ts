import { FindOptionsSelect } from "typeorm";
import { Teacher } from "../entities/teacher.entity";

export const teachersColumnsConfig: FindOptionsSelect<Teacher> = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    teacherId: true,
    dob: true,
    gender: true,
    joinedDate: true,
    createdAt: true,
    profileImage: {
        id: true,
        url: true
    },
    account: {
        id: true,
    }
}