import { FindOptionsSelect } from "typeorm";
import { Enrollment } from "./enrollment.entity";

export const enrollmentSelectColumns: FindOptionsSelect<Enrollment> = {
    id: true,
    createdAt: true,
    enrollmentDate: true,
    registrationNumber: true,
    student: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        dob: true,
        phone: true,
    },
    classRoom: {
        id: true,
        name: true,
        parent: {
            id: true,
            name: true,
        }
    },
    academicYear: {
        id: true,
        name: true
    }
}