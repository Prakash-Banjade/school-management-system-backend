import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsUUID } from "class-validator";

export enum ClassRoomAttendancePeriod {
    WEEK = 'WEEK',
    MONTH = 'MONTH',
    // YEAR = 'YEAR',
}

export class AttendanceStatisticsQueryDto {
    @ApiProperty({ type: String, format: 'uuid', description: 'Class room id' })
    @IsUUID()
    classRoomId: string;

    @ApiProperty({ type: String, enum: ClassRoomAttendancePeriod, description: 'Period' })
    @IsEnum(ClassRoomAttendancePeriod)
    period: string;
}