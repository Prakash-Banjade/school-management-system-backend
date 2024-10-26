import { FindOptionsSelect } from "typeorm";
import { Attendance } from "../entities/attendance.entity";

export const attendanceSelectCols: FindOptionsSelect<Attendance> = {
    id: true,
    createdAt: true,
    // updatedAt: true,
    status: true,
    date: true,
    inTime: true,
    outTime: true
}