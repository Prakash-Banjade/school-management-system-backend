import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsDateString, IsEnum, IsNumber, IsOptional, IsUUID } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";
import { EAttendanceStatus } from "src/common/types/global.type";

export class AttendanceQueryDto extends QueryDto {
    @ApiPropertyOptional({ type: "string", format: 'date-time', description: 'Date of the attendance' })
    @IsDateString()
    @IsOptional()
    date?: string;

    @ApiPropertyOptional({ type: 'string', enum: EAttendanceStatus, description: 'Status of the attendance' })
    @IsEnum(EAttendanceStatus)
    @IsOptional()
    status?: EAttendanceStatus;

    @ApiPropertyOptional({ type: "string", format: 'uuid', description: 'Account id' })
    @IsUUID()
    @IsOptional()
    accountId?: string;

    @ApiPropertyOptional({ type: Number, description: 'Month of the attendance' })
    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => {
        if (!isNaN(Number(value))) return Math.abs(Number(value));
        return undefined;
    })
    month?: number;
}