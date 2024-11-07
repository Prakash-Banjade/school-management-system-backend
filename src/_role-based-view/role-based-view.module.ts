import { Module } from '@nestjs/common';
import { StudentViewModule } from './student/student-view.module';
import { TeacherViewModule } from './teacher/teacher-view.module';

@Module({
    imports: [
        StudentViewModule,
        TeacherViewModule,
    ],
})
export class RoleBasedViewModule { }
