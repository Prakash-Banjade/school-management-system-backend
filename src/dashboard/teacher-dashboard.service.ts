import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ClassRoom } from "src/class-rooms/entities/class-room.entity";
import { ClassRoutine } from "src/class-routines/entities/class-routine.entity";
import { AuthUser, EDayOfWeek, ELeaveRequestStatus } from "src/common/types/global.type";
import { LeaveRequest } from "src/leave-requests/entities/leave-request.entity";
import { TaskSubmission } from "src/task-system/task-submissions/entities/task-submission.entity";
import { Teacher } from "src/teachers/entities/teacher.entity";
import { isTeacher } from "src/utils/utils";
import { Repository } from "typeorm";

@Injectable()
export class TeacherDashboardService {
    constructor(
        @InjectRepository(ClassRoom) private readonly classRoomsRepo: Repository<ClassRoom>,
        @InjectRepository(ClassRoutine) private readonly classRoutinesRepo: Repository<ClassRoutine>,
        @InjectRepository(TaskSubmission) private readonly taskSubmissionRepo: Repository<TaskSubmission>,
        @InjectRepository(LeaveRequest) private readonly leaveRequestRepo: Repository<LeaveRequest>,
        @InjectRepository(Teacher) private readonly teachersRepo: Repository<Teacher>,
    ) { }

    async getTeacherDashboardCounts(currentUser: AuthUser) {
        if (!isTeacher(currentUser)) throw new ForbiddenException('Access denied');

        const totalClassesQuerybuilder = this.classRoomsRepo.createQueryBuilder('classRoom')
            .innerJoin(
                'classRoom.classRoutines',
                'classRoutine',
                'classRoutine.teacherId = :teacherId OR classRoom.classTeacherId = :teacherId',
                { teacherId: currentUser.teacherId }
            );

        const pendingAssignmentsQuerybuilder = this.taskSubmissionRepo.createQueryBuilder('taskSubmission')
            .leftJoin('taskSubmission.task', 'task')
            .leftJoin('task.classRoom', 'classRoom')
            .innerJoin("taskSubmission.evaluation", "evaluation", "evaluation.id IS NULL")
            .innerJoin('classRoom.classRoutines', 'classRoutine', 'classRoutine.teacherId = :teacherId', { teacherId: currentUser.teacherId });

        const pendingLeaveRequestsQuerybuilder = this.leaveRequestRepo.createQueryBuilder('leaveRequest')
            .leftJoin("leaveRequest.account", "account")
            .leftJoin("account.student", "student")
            .innerJoin("student.classRoom", "classRoom", "classRoom.classTeacherId = :teacherId", { teacherId: currentUser.teacherId })
            .where('leaveRequest.status = :status', { status: ELeaveRequestStatus.PENDING });

        const teacher = this.teachersRepo.createQueryBuilder('teacher')
            .where({ id: currentUser.teacherId })
            .select(['teacher.payAmount']);

        const [totalClasses, pendingAssignments, pendingLeaveRequests, { payAmount: teacherPayAmount }] = await Promise.all([
            totalClassesQuerybuilder.getCount(),
            pendingAssignmentsQuerybuilder.getCount(),
            pendingLeaveRequestsQuerybuilder.getCount(),
            teacher.getOne(),
        ]);

        return {
            totalClasses,
            pendingAssignments,
            pendingLeaveRequests,
            teacherPayAmount: teacherPayAmount,
        }
    }

    async getTodaySchedule(currentUser: AuthUser) {
        if (!isTeacher(currentUser)) throw new ForbiddenException('Access denied');

        const today = Object.entries(EDayOfWeek)[new Date().getDay()][1];

        const querybuilder = this.classRoutinesRepo.createQueryBuilder("classRoutine")
            .leftJoin('classRoutine.classRoom', 'classRoom')
            .leftJoin('classRoom.parent', 'parent')
            .leftJoin('classRoutine.subject', 'subject')
            .leftJoin('classRoutine.teacher', 'teacher')
            .andWhere('teacher.id = :teacherId', { teacherId: currentUser.teacherId })
            .andWhere('classRoutine.dayOfTheWeek = :dayOfTheWeek', { dayOfTheWeek: today })
            .select([
                "classRoutine.id as id",
                "classRoutine.startTime as startTime",
                "classRoutine.endTime as endTime",
                "classRoom.fullName as classRoomName",
                "subject.subjectName as subjectName",
            ])
            .cache(true)

        return querybuilder.getRawMany();
    }
}