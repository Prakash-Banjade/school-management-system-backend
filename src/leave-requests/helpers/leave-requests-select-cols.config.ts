import { FindOptionsSelect } from "typeorm";
import { LeaveRequest } from "../entities/leave-request.entity";

export const leaveRequestSelectCols: FindOptionsSelect<LeaveRequest> = {
    id: true,
    createdAt: true,
    requestedOn: true,
    status: true,
    title: true,
    description: true,
    leaveFrom: true,
    leaveTo: true,
    account: {
        id: true,
        student: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
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
    },
}

export const employeesLeaveRequestSelectCols: FindOptionsSelect<LeaveRequest> = {
    id: true,
    createdAt: true,
    requestedOn: true,
    status: true,
    title: true,
    description: true,
    leaveFrom: true,
    leaveTo: true,
    account: {
        id: true,
        teacher: {
            id: true,
            firstName: true,
            lastName: true,
            teacherId: true,
        },
        staff: {
            id: true,
            firstName: true,
            lastName: true,
            staffId: true,
        },
    },
}