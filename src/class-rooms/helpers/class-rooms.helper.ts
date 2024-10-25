import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ClassRoom } from "../entities/class-room.entity";
import { Repository } from "typeorm";
import { QueryDto } from "src/common/dto/query.dto";
import { EClassType } from "src/common/types/global.type";
import { applySelectColumns } from "src/utils/apply-select-cols";
import { classRoomOptionsSelectCols } from "./class-room-select-cols.config";
import paginatedData from "src/utils/paginatedData";

@Injectable()
export class ClassRoomsHelper {
    constructor(
        @InjectRepository(ClassRoom) private readonly classRoomRepo: Repository<ClassRoom>,
    ) { }

    async getClassRoomsOptions(queryDto: QueryDto) {
        const queryBuilder = this.classRoomRepo.createQueryBuilder('classRoom');

        queryBuilder
            .orderBy("classRoom.createdAt", queryDto.order)
            .skip(queryDto.skipPagination ? undefined : queryDto.skip)
            .take(queryDto.skipPagination ? undefined : queryDto.take)
            .leftJoin("classRoom.children", "children")
            .where('classRoom.classType = :classType', { classType: EClassType.PRIMARY })

        applySelectColumns(queryBuilder, classRoomOptionsSelectCols, 'classRoom');

        return paginatedData(queryDto, queryBuilder);
    }

}