import { FindOptionsSelect } from "typeorm";
import { ClassRoutine } from "../entities/class-routine.entity";

export const classRoutinesSelectCols: FindOptionsSelect<ClassRoutine> = {
    id: true,
    createdAt: true,
    updatedAt: true,
    dayOfTheWeek: true,
    startTime: true,
    endTime: true,
    type: true,
    classRoom: {
        id: true,
        fullName: true,
        parent: {
            id: true
        }
    },
    subject: {
        id: true,
        subjectName: true,
        subjectCode: true,
    },
    teacher: {
        id: true,
        firstName: true,
        lastName: true
    }
}