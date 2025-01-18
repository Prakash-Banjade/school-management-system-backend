import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsUUID } from "class-validator";
import { EAttendanceStatus } from "src/common/types/global.type";

export class CreateAttendanceDto {
    @ApiProperty({ type: String, format: 'uuid' })
    @IsUUID()
    @IsNotEmpty()
    accountId: string;

    @ApiProperty({ type: 'string', enum: EAttendanceStatus })
    @IsNotEmpty()
    @IsEnum(EAttendanceStatus)
    status: EAttendanceStatus

    @ApiPropertyOptional({ type: String, format: 'date-time' })
    @IsNotEmpty()
    @IsDateString()
    date: string;

    @ApiPropertyOptional({ type: String, format: 'date-time' })
    @IsNotEmpty()
    @IsOptional()
    @IsDateString()
    inTime?: string;

    @ApiPropertyOptional({ type: String, format: 'date-time' })
    @IsNotEmpty()
    @IsOptional()
    @IsDateString()
    outTime?: string;
}

export class CreateLeaveAttendanceEvent {
    @ApiProperty({ type: String, format: 'uuid' })
    @IsUUID()
    @IsNotEmpty()
    accountId: string;

    @ApiPropertyOptional({ type: String, format: 'date-time' })
    @IsNotEmpty()
    @IsDateString()
    dateFrom: string;

    @ApiPropertyOptional({ type: String, format: 'date-time' })
    @IsNotEmpty()
    @IsDateString()
    dateTo: string;

    constructor(dto: CreateLeaveAttendanceEvent) {
        Object.assign(this, dto);
    }
}