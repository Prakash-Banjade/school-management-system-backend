import { FindOptionsSelect } from "typeorm";
import { TaskSubmission } from "../entities/task-submission.entity";

export const taskSubmissionSelectCols: FindOptionsSelect<TaskSubmission> = {
    id: true,
    createdAt: true,
    updatedAt: true,
    student: {
        id: true,
        studentId: true,
        firstName: true,
        lastName: true,
    },
    attachments: {
        id: true,
        url: true,
        originalName: true,
    },
    note: true,
    status: true,
    evaluation: {
        id: true,
    }
}