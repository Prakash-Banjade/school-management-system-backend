import { FindOptionsSelect } from "typeorm";
import { DormitoryRoom } from "../entities/dormitory-room.entity";

export const dormitoryRoomSelectCols: FindOptionsSelect<DormitoryRoom> = {
    id: true,
    costPerBed: true,
    createdAt: true,
    updatedAt: true,
    description: true,
    dormitory: {
        id: true,
        name: true,
        address: true,
    },
    noOfBeds: true,
    name: true,
    roomNumber: true,
    roomType: {
        id: true,
        name: true,
    },
    students: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        profileImage: {
            id: true,
            url: true,
        },
        classRoom: {
            id: true,
            name: true,
            parent: {
                id: true, 
                name: true,
            }
        }
    }
}