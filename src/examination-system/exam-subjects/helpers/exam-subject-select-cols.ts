export const examSubjectSelectCols = [
    'examSubject.id as id',
    'examSubject.examDate as examDate',
    'examSubject.startTime as startTime',
    'examSubject.duration as duration',
    'examSubject.fullMark as fullMark',
    'examSubject.passMark as passMark',
    'examSubject.venue as venue',
    'subject.subjectName as subjectName',
    'examType.name as examType',
    'classRoom.name as classRoomName',
    'parent.name as parentClassName',
];

export const examSubjectOptionsSelectCols = [
    'examSubject.id as value',
    'subject.subjectName as label',
]

