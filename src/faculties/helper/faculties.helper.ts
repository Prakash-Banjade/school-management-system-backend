import { ForbiddenException, Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { FacultyOptionsQueryDto } from "../dto/faculties-query.dto";
import { UtilitiesService } from "src/utilities/utilities.service";
import { Faculty } from "../entities/faculty.entity";
import { EClassType } from "src/common/types/global.type";
import { isTeacher } from "src/utils/utils";

@Injectable()
export class FacultiesHelper {
    constructor(
        private readonly dataSource: DataSource,
        private readonly utilitiesService: UtilitiesService,
    ) { }

    async getOptionsForTeacher(queryDto: FacultyOptionsQueryDto) {
        const branchId = this.utilitiesService.getBranchId();
        const currentUser = this.utilitiesService.getCurrentUser();

        if (!isTeacher(currentUser)) throw new ForbiddenException('Access Denied');

        const querybuilder = this.dataSource.getRepository(Faculty).createQueryBuilder('faculty')
            .orderBy('faculty.name', 'ASC')
            .select(["faculty.id", "faculty.name"]);

        // select class rooms
        querybuilder
            .leftJoin(
                "faculty.classRooms",
                "classRooms",
                "classRooms.classType = :classType AND classRooms.branchId = :branchId",
                { classType: EClassType.PRIMARY, branchId }
            )
            .addSelect([
                "classRooms.id",
                "classRooms.name"
            ])

        // select children classes
        querybuilder
            .leftJoin('classRooms.children', 'children')
            .addSelect([
                "children.id",
                "children.name"
            ])

        // apply filter to get the classes of teacher
        if (queryDto.assigned) {
            querybuilder
                .andWhere('classRooms.classTeacherId = :teacherId OR children.classTeacherId = :teacherId', { teacherId: currentUser.teacherId });
        } else {
            querybuilder
                .leftJoin('classRooms.classRoutines', 'classRoutine')
                .leftJoin('children.classRoutines', 'childrenClassRoutine')
                .andWhere('classRoutine.teacherId = :teacherId OR childrenClassRoutine.teacherId = :teacherId', { teacherId: currentUser.teacherId });
        }


        return querybuilder.cache(true).distinct(true).getMany();
    }
}