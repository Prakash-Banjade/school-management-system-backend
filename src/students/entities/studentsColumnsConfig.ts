import { FindOptionsSelect } from "typeorm";
import { Student } from "./student.entity";

export const studentsColumnsConfig: FindOptionsSelect<Student> = {
    id: true,
    createdAt: true,
    firstName: true,
    lastName: true,
    email: true,
    dob: true,
    classRoom: {
        id: true,
        name: true,
        parent: {
            id: true,
            name: true,
        }
    },
    guardians: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
    },
    account: {
        id: true,
        user: {
            id: true,
        }
    }
}