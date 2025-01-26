import { FindOptionsSelect } from "typeorm";
import { Student } from "../entities/student.entity";

export const singleStudentColumnsConfig: FindOptionsSelect<Student> = {
    id: true,
    createdAt: true,
    firstName: true,
    lastName: true,
    email: true,
    dob: true,
    phone: true,
    gender: true,
    studentId: true,
    rollNo: true,
    additionalNotes: true,
    bankAccountNumber: true,
    bankName: true,
    ifscCode: true,
    previousSchoolDetails: true,
    previousSchoolName: true,
    birthCertificateNumber: true,
    nationalIdCardNo: true,
    isPhysicallyChallenged: true,
    bloodGroup: true,
    caste: true,
    religion: true,
    currentAddress: true,
    permanentAddress: true,
    enrollments: {
        id: true,
        rollNo: true,
        classRoom: {
            id: true,
            name: true,
            parent: {
                id: true,
                name: true,
            }
        }
    },
    documentAttachments: {
        id: true,
        url: true,
        originalName: true,
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
        receiveNotification: true,
    },
    dormitoryRoom: {
        id: true,
        roomNumber: true,
    },
    routeStop: {
        id: true,
        name: true,
        vehicle: {
            id: true,
            vehicleNumber: true
        }
    },
    account: {
        id: true,
        profileImage: {
            id: true,
            url: true
        },
    }
}