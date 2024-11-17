import { FindOptionsSelect } from "typeorm";
import { MarksGrade } from "../entities/marks-grade.entity";

export const markGradeSelectCols: FindOptionsSelect<MarksGrade> = {
    id: true,
    gradeName: true,
    gradeScale: true,
    percentFrom: true,
    percentTo: true,
    description: true,
}