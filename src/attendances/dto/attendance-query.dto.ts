import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsOptional, IsUUID } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";
import { EAttendanceStatus } from "src/common/types/global.type";

export class AttendaceQueryDto extends QueryDto {
    @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Date of the attendance' })
    @IsDateString()
    @IsOptional()
    date?: string;

    @ApiPropertyOptional({ type: 'enum', enum: EAttendanceStatus, description: 'Status of the attendance' })
    @IsEnum(EAttendanceStatus)
    @IsOptional()
    status?: EAttendanceStatus;

    @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Class room id' })
    @IsUUID()
    @IsOptional()
    classRoomId?: string;

    @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Student room id' })
    @IsUUID()
    @IsOptional()
    studentId?: string;
}