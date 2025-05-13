import { CurrentUser } from "src/common/decorators/user.decorator";
import { AuthUser, Gender } from "src/common/types/global.type";
import { ClassRoomQueryDto } from "../dto/classRoom-query.dto";
import { AcademicYearsService } from "src/academic-years/academic-years.service";
import { InjectRepository } from "@nestjs/typeorm";
import { ClassRoom } from "../entities/class-room.entity";
import { Brackets, Repository } from "typeorm";
import { paginatedRawData } from "src/utils/paginatedData";
import { isTeacher } from "src/utils/utils";
import { ForbiddenException } from "@nestjs/common";

export class ClassRoomsTeacherViewService {
    constructor(
        private readonly academicYearService: AcademicYearsService,
        @InjectRepository(ClassRoom) private readonly classRoomsRepo: Repository<ClassRoom>,
    ) { }

    async findAll(queryDto: ClassRoomQueryDto, @CurrentUser() currentUser: AuthUser) {
        if (!isTeacher(currentUser)) throw new ForbiddenException('Access Denied');

        const currentAcademicYearId = await this.academicYearService.getCurrentAcademicYearId();

        const queryBuilder = this.classRoomsRepo.createQueryBuilder('classRoom')
            .andWhere(new Brackets(qb => {
                queryDto.search && qb.andWhere('LOWER(classRoom.name) LIKE LOWER(:search)', { search: `%${queryDto.search}%` })
            }))
            .orderBy("classRoom.createdAt", queryDto.order)
            .offset(queryDto.skip)
            .limit(queryDto.take)
            .leftJoin('classRoom.students', 'student', 'FIND_IN_SET(:currentAcademicYearId, student.academicYearIds) > 0', { currentAcademicYearId })
            .leftJoin('classRoom.children', 'childClass')
            .leftJoin('childClass.students', 'childClassStudent', 'FIND_IN_SET(:currentAcademicYearId, childClassStudent.academicYearIds) > 0', { currentAcademicYearId })
            .select([
                "classRoom.id as id",
                "classRoom.fullName as name",
                "classRoom.location as location",
                "classRoom.classType as classType",
                "classRoom.facultyId as facultyId",
                "classRoom.parentId as parentId",
            ])
            .addSelect([
                'COUNT(DISTINCT student.id) + COUNT(DISTINCT childClassStudent.id) AS totalStudentsCount',
                `COUNT(DISTINCT CASE WHEN student.gender = '${Gender.MALE}' THEN student.id END) + COUNT(DISTINCT CASE WHEN childClassStudent.gender = '${Gender.MALE}' THEN childClassStudent.id END) AS totalMaleStudentsCount`,
                `COUNT(DISTINCT CASE WHEN student.gender = '${Gender.FEMALE}' THEN student.id END) + COUNT(DISTINCT CASE WHEN childClassStudent.gender = '${Gender.FEMALE}' THEN childClassStudent.id END) AS totalFemaleStudentsCount`,
                `CASE WHEN classRoom.classTeacherId = :teacherId THEN 1 ELSE 0 END AS isClassTeacher`,
            ]);

        // filter classes either assigned to teacher or teacher has routine in the class
        queryBuilder
            .leftJoin('classRoom.classRoutines', 'classRoutine')
            .andWhere('classRoutine.teacherId = :teacherId OR classRoom.classTeacherId = :teacherId', { teacherId: currentUser.teacherId });

        queryBuilder
            .setParameter('teacherId', currentUser.teacherId)
            .cache(true)
            .groupBy('classRoom.id')  // Ensure group by to aggregate counts per classRoom

        return paginatedRawData(queryDto, queryBuilder);
    }
}