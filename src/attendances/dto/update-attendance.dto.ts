import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { EAttendanceStatus } from 'src/common/types/global.type';

export class UpdateAttendanceDto {
    @ApiPropertyOptional({ type: 'string', enum: EAttendanceStatus, description: 'Status of the attendance' })
    @IsNotEmpty()
    @IsOptional()
    @IsEnum(EAttendanceStatus)
    status?: EAttendanceStatus

    @ApiPropertyOptional({ type: "string", format: 'date-time', description: 'Out time of the attendance' })
    @IsOptional()
    @IsDateString()
    @IsNotEmpty()
    outTime?: string;
}
