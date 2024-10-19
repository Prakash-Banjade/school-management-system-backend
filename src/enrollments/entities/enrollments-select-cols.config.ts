import { FindOptionsSelect } from "typeorm";
import { Enrollment } from "./enrollment.entity";

export const enrollmentSelectColumns: FindOptionsSelect<Enrollment> = {
    id: true,
    createdAt: true,
    student: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        dob: true,
    },
    classRoom: {
        id: true,
        name: true
    },
    academicYear: {
        id: true,
        name: true
    }
}