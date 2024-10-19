import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { EAttendanceStatus } from 'src/common/types/global.type';

export class UpdateAttendanceDto {
    @ApiPropertyOptional({ type: 'enum', enum: EAttendanceStatus })
    @IsNotEmpty()
    @IsOptional()
    @IsEnum(EAttendanceStatus)
    status?: EAttendanceStatus

    @ApiPropertyOptional({ type: String, format: 'date-time' })
    @IsOptional()
    @IsDateString()
    @IsNotEmpty()
    outTime?: string;
}
