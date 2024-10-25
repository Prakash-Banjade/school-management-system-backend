import { FindOptionsSelect } from "typeorm"
import { ClassRoom } from "../entities/class-room.entity"

export const classRoomsColumnsConfig: FindOptionsSelect<ClassRoom> = {
    id: true,
    name: true,
    monthlyTutionFee: true,
    monthlyFee: true,
    location: true,
    createdAt: true,
    // classRoomParentClass: {
    //     id: true,
    //     name: true,
    //     classType: true,
    //     // parentClass: {
    //     //     id: true,
    //     //     name: true,
    //     //     classType: true,
    //     // },
    // },
    // childrenClasses: {
    //     id: true,
    //     name: true,
    //     classType: true
    // },
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
