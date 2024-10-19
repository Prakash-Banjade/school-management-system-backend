import { Module } from '@nestjs/common';
import { MarksGradesModule } from './marks-grades/marks-grades.module';
import { ExamTypesModule } from './exam-types/exam-types.module';
import { ExamsModule } from './exams/exams.module';
import { ExamSubjectsModule } from './exam-subjects/exam-subjects.module';
import { ExamReportsModule } from './exam-reports/exam-reports.module';

@Module({
    imports: [
        MarksGradesModule,
        ExamTypesModule,
        ExamsModule,
        ExamSubjectsModule,
        ExamReportsModule,
    ],
})
export class ExaminationSystemModule {}
