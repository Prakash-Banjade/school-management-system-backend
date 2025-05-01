import { FindOptionsSelect } from "typeorm";
import { LessonPlan } from "../entities/lesson-plan.entity";

export const lessonPlanSelectCols: FindOptionsSelect<LessonPlan> = {
    id: true,
    createdAt: true,
    startDate: true,
    endDate: true,
    title: true,
    description: true,
    status: true,
    subject: {
        id: true,
        subjectName: true,
    },
    classRoom: {
        id: true,
        fullName: true,
        parent: {
            id: true,
            name: true,
        },
        faculty: {
            id: true,
            name: true,
        }
    },
    createdBy: {
        firstName: true,
        lastName: true,
    },
    attachments: {
        id: true,
        url: true,
        originalName: true,
    }
}