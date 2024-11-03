import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ClassRoom } from "../entities/class-room.entity";
import { AttendanceStatisticsQueryDto } from "../dto/attendance-statistics-query.dto";

@Injectable()
export class ClassRoomsStatistics {
    constructor(
        @InjectRepository(ClassRoom) private readonly classRoomRepo: Repository<ClassRoom>,
    ) { }

    async getAttendanceStatistics(queryDto: AttendanceStatisticsQueryDto) {
        const queryBuilder = this.classRoomRepo.createQueryBuilder('classRoom')
            .where('classRoom.id = :classRoomId', { classRoomId: queryDto.classRoomId })
            .leftJoin("classRoom.students", "students")
            .leftJoin("classRoom.children", "childrenClass")
            .leftJoin("childrenClass.students", "childrenStudents")
    }
}