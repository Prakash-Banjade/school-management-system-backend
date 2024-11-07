import { FindOptionsSelect } from "typeorm";
import { ExamSubject } from "../entities/exam-subject.entity";

export const examSubjectSelectCols: FindOptionsSelect<ExamSubject> = {
    id: true,
    examDate: true,
    startTime: true,
    duration: true,
    fullMark: true,
    passMark: true,
    venue: true,
    createdAt: true,
}