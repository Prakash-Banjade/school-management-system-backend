import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsUUID } from "class-validator";
import { EAttendanceStatus } from "src/common/types/global.type";

export class CreateAttendanceDto {
    @ApiProperty({ type: "string", format: 'uuid', description: 'Account id' })
    @IsUUID()
    @IsNotEmpty()
    accountId: string;

    @ApiProperty({ type: 'string', enum: EAttendanceStatus, description: 'Status of the attendance' })
    @IsNotEmpty()
    @IsEnum(EAttendanceStatus)
    status: EAttendanceStatus

    @ApiPropertyOptional({ type: "string", format: 'date-time', description: 'Date of the attendance' })
    @IsNotEmpty()
    @IsDateString()
    date: string;

    @ApiPropertyOptional({ type: "string", format: 'date-time', description: 'In time of the attendance' })
    @IsNotEmpty()
    @IsOptional()
    @IsDateString()
    inTime?: string;

    @ApiPropertyOptional({ type: "string", format: 'date-time', description: 'Out time of the attendance' })
    @IsNotEmpty()
    @IsOptional()
    @IsDateString()
    outTime?: string;
}

export class CreateLeaveAttendanceEvent {
    @ApiProperty({ type: "string", format: 'uuid', description: 'Account id' })
    @IsUUID()
    @IsNotEmpty()
    accountId: string;

    @ApiPropertyOptional({ type: "string", format: 'date-time', description: 'Date from' })
    @IsNotEmpty()
    @IsDateString()
    dateFrom: string;

    @ApiPropertyOptional({ type: "string", format: 'date-time', description: 'Date to' })
    @IsNotEmpty()
    @IsDateString()
    dateTo: string;

    constructor(dto: CreateLeaveAttendanceEvent) {
        Object.assign(this, dto);
    }
}