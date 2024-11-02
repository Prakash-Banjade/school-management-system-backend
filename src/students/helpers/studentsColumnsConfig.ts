import { FindOptionsSelect } from "typeorm";
import { Student } from "../entities/student.entity";

export const studentsColumnsConfig: FindOptionsSelect<Student> = {
    id: true,
    createdAt: true,
    firstName: true,
    lastName: true,
    email: true,
    dob: true,
    phone: true,
    gender: true,
    studentId: true,
    profileImage: {
        id: true,
        url: true
    },
    rollNo: true,
    classRoom: {
        id: true,
        name: true,
        parent: {
            id: true,
            name: true,
        }
    },
    account: {
        id: true
    }
}

export const singleStudentColumnsConfig: FindOptionsSelect<Student> = {
    documentAttachments: {
        id: true,
        url: true,
        originalName: true,
    },
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
        address: true,
        occupation: true,
        profileImage: {
            id: true,
            url: true
        },
        relation: true,
    },
    dormitoryRoom: {
        id: true,
        roomNumber: true,
    }
}