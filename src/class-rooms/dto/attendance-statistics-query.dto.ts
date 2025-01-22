import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";

export enum ClassRoomAttendancePeriod {
    THIS_WEEK = 'thisWeek',
    PAST_7_DAYS = 'past7Days',
    PAST_30_DAYS = 'past30Days',
    THIS_MONTH = 'thisMonth',
}

export class AttendanceStatisticsQueryDto {
    @ApiProperty({ type: "string", enum: ClassRoomAttendancePeriod, description: 'Period' })
    @IsEnum(ClassRoomAttendancePeriod)
    period: string;
}