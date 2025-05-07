import { Injectable } from "@nestjs/common";
import { Teacher } from "../entities/teacher.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class TeacherUtilsService {
    constructor(
        @InjectRepository(Teacher) private readonly teacherRepo: Repository<Teacher>
    ) { }

    async generateTeacherId() {
        const currentYear = new Date().getFullYear();

        const lastTeacher = await this.teacherRepo
            .createQueryBuilder('teacher')
            .orderBy('teacher.createdAt', 'DESC')
            .limit(1)
            .select(['teacher.id', 'teacher.teacherId'])
            .getOne();

        if (!lastTeacher || !lastTeacher.teacherId) {
            return `TCR-${currentYear}-00001`;
        }

        const lastTeacherIdParts = lastTeacher.teacherId?.split('-');
        const lastYear = parseInt(lastTeacherIdParts[1], 10);
        const lastCounter = parseInt(lastTeacherIdParts[2], 10);

        if (lastYear !== currentYear) {
            return `TCR-${currentYear}-00001`; // Reset counter if the year has changed
        }

        const newCounter = (lastCounter + 1).toString().padStart(5, '0');
        return `TCR-${currentYear}-${newCounter}`;
    }
}