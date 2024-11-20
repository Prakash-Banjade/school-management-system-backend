import { FindOptionsSelect } from "typeorm"
import { ClassRoom } from "../entities/class-room.entity"

export const classRoomColumnsConfig: FindOptionsSelect<ClassRoom> = {
    id: true,
    name: true,
    admissionFee: true,
    monthlyFee: true,
    location: true,
    createdAt: true,
    classTeacher: {
        id: true,
        firstName: true,
        lastName: true,
    },
    description: true,
    parent: {
        id: true,
        name: true,
    },
    classType: true,
}

export const classRoomOptionsSelectCols: FindOptionsSelect<ClassRoom> = {
    id: true,
    name: true,
    createdAt: true,
    children: {
        id: true,
        name: true,
    }
}
