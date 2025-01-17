import { FindOptionsSelect } from "typeorm";
import { Subject } from "../entities/subject.entity";

export const subjectSelectCols_basic: FindOptionsSelect<Subject> = {
    id: true,
    subjectName: true,
    subjectCode: true,
    createdAt: true,
}

export const subjectSelectCols: FindOptionsSelect<Subject> = {
    ...subjectSelectCols_basic,
    theoryPM: true,
    theoryFM: true,
    practicalPM: true,
    practicalFM: true,
    type: true,
    classRoom: {
        id: true,
        name: true,
        faculty: {
            id: true,
            name: true
        }
    },
    teachers: {
        id: true,
        firstName: true,
        lastName: true,
    },
    content: true, // TODO: actually this should not be sent because it can be too big, for simplicity in frontend, I am sending it for now
}

export const singleSubjectSelelctCols: FindOptionsSelect<Subject> = {
    ...subjectSelectCols,
    content: true,
    optionalSubject: { id: true }
}