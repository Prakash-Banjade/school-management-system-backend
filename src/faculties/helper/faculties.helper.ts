import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { FacultyOptionsQueryDto } from "../dto/faculties-query.dto";
import { UtilitiesService } from "src/utilities/utilities.service";
import { Faculty } from "../entities/faculty.entity";
import { EClassType } from "src/common/types/global.type";
import { ClassRoutine } from "src/class-routines/entities/class-routine.entity";

@Injectable()
export class FacultiesHelper {
    constructor(
        private readonly dataSource: DataSource,
        private readonly utilitiesService: UtilitiesService,
    ) { }

    async getOptionsForTeacher(queryDto: FacultyOptionsQueryDto) {
        const branchId = this.utilitiesService.getBranchId();
        const { accountId } = this.utilitiesService.getCurrentUser();

        const includeSection = queryDto.include === 'section';
        const includeClassRoom = includeSection || queryDto.include === 'classRoom';

        const querybuilder = this.dataSource.getRepository(Faculty).createQueryBuilder('faculty').orderBy('faculty.name', 'ASC').distinct(true)

        if (includeClassRoom) {
            querybuilder.leftJoin(
                "faculty.classRooms",
                "classRooms",
                "classRooms.classType = :classType AND classRooms.branchId = :branchId",
                { classType: EClassType.PRIMARY, branchId }
            )
        }

        if (includeSection) {
            querybuilder.leftJoin("classRooms.children", "children")
        }

        querybuilder.select([
            "faculty.id",
            "faculty.name",
            ...(
                includeClassRoom ? [
                    "classRooms.id",
                    "classRooms.name"
                ] : []
            ),
            ...(
                includeSection ? [
                    "children.id",
                    "children.name"
                ] : []
            )
        ]);

        return querybuilder.getMany();
    }


    /**
    |--------------------------------------------------
    | TODO: IMPLEMENT A DEFAULT SECTION WITH SAME CLASS NAME WHEN CLASS ROOM IS ADDED AT FIRST, SO THAT NO NO CLASSROOM WITH NO CHILDREN
    |--------------------------------------------------
    */

    private async getClassRoomIds() {
        const { accountId } = this.utilitiesService.getCurrentUser();

        const classRoutines = this.dataSource.getRepository(ClassRoutine).createQueryBuilder('classRoutine')
            .leftJoin('classRoutine.classRoom', 'classRoom')
            .leftJoin('classRoom.parent', 'parent')
            .leftJoin('classRoutine.teacher', 'teacher')
            .where('teacher.accountId = :accountId', { accountId })
            .select([
                'classRoutine.id',
                'classRoom.id',
                'parent.id',
            ])
            .distinct(true);

        return classRoutines.getMany();
    }
}