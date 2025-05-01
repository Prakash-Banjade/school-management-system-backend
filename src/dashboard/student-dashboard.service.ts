import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AcademicYearsService } from "src/academic-years/academic-years.service";
import { AuthUser } from "src/common/types/global.type";
import { Exam } from "src/examination-system/exams/entities/exam.entity";
import { isStudent } from "src/utils/utils";
import { Repository } from "typeorm";

@Injectable()
export class StudentDashboardService {
    constructor(
        private readonly academicYearService: AcademicYearsService,
        @InjectRepository(Exam) private readonly examRepo: Repository<Exam>,
    ) { }

    async getUpcommingExam(currentUser: AuthUser) { // used in student dashboard
        if (!isStudent(currentUser)) throw new ForbiddenException();

        const academicYearId = await this.academicYearService.getCurrentAcademicYearId();

        const querybuilder = this.examRepo.createQueryBuilder('exam')
            .where("exam.academicYearId = :academicYearId", { academicYearId })
            .andWhere("exam.classRoomId = :classRoomId", { classRoomId: currentUser.parentClassId ?? currentUser.classRoomId }) // exam is associated with primary class, so check with parentClassId first
            .andWhere("DATE(exam.startingFrom) >= DATE(:today) OR DATE(exam.endsOn) >= DATE(:today)", { today: new Date() })
            .leftJoin("exam.examType", "examType")
            .leftJoin("exam.examSubjects", "examSubjects")
            .leftJoin("examSubjects.subject", "subject")
            .select([
                "exam.id",
                "exam.startingFrom",
                "exam.endsOn",
                "examType.id",
                "examType.name",
                "examSubjects.id",
                "examSubjects.examDate",
                "subject.id",
                "subject.subjectName",
                "examSubjects.venue",
                "examSubjects.startTime",
            ])
            .orderBy("exam.startingFrom", "ASC")
            .cache(true);

        return querybuilder.getOne();
    }

}