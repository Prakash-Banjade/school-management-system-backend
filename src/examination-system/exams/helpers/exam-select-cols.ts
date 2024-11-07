import { FindOptionsSelect } from "typeorm";
import { Exam } from "../entities/exam.entity";

export const examSelectCols: FindOptionsSelect<Exam> = {
    id: true,
    classRoom: {
        id: true,
        name: true,
        parent: {
            id: true,
            name: true,
        }
    },
    createdAt: true,
    examType: {
        id: true,
        name: true,
    }
}