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

export const singleExamSelectCols: FindOptionsSelect<Exam> = {
    id: true,
    createdAt: true,
    examType: {
        id: true,
        name: true,
    },
    classRoom: {
        id: true,
        name: true,
        parent: {
            id: true,
            name: true,
        }
    },
    examSubjects: {
        id: true,
        subject: {
            id: true,
            subjectCode: true,
            subjectName: true,
        },
        duration: true,
        examDate: true,
        startTime: true,
        fullMark: true,
        passMark: true,
        venue: true,
    }
}