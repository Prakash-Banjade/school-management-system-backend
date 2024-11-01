import { FindOptionsSelect } from "typeorm";
import { Task } from "../entities/task.entity";

export const selectTaskCols: FindOptionsSelect<Task> = {
    id: true,
    createdAt: true,
    updatedAt: true,
    title: true,
    description: true,
    marks: true,
    deadline: true,
    taskType: true,
    setBy: {
        id: true,
        firstName: true,
        lastName: true,
    },
    attachments: {
        id: true,
        url: true,
        originalName: true,
    },
    subject: {
        id: true,
        subjectName: true,
    },
    classRooms: {
        id: true,
        name: true,
        parent: {
            id: true,
            name: true,
        }
    }
}