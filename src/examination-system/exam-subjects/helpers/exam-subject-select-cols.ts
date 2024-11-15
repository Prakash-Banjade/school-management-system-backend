export const examSubjectSelectCols = [
    'examSubject.id as id',
    'examSubject.examDate as examDate',
    'examSubject.startTime as startTime',
    'examSubject.duration as duration',
    'examSubject.theoryFM as theoryFM',
    'examSubject.theoryPM as theoryPM',
    'examSubject.practicalFM as practicalFM',
    'examSubject.practicalPM as practicalPPM',
    'examSubject.venue as venue',
    'subject.subjectName as subjectName',
    'examType.name as examType',
    'examType.id as examTypeId',
    'classRoom.name as classRoomName',
    'exam.academicYearId as academicYearId',
];

export const examSubjectOptionsSelectCols = [
    'examSubject.id as value',
    'subject.subjectName as label',
]

