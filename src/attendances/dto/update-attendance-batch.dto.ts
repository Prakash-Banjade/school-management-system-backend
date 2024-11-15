import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsDateString, IsDefined, IsEnum, IsOptional, IsUUID, ValidateIf, ValidateNested } from "class-validator";
import { EAttendanceStatus } from "src/common/types/global.type";

const UpdateStatusEnum = [...Object.values(EAttendanceStatus), null];

class UpdateAttendanceDto {
    @ApiPropertyOptional({ type: String, format: 'uuid' })
    @IsUUID()
    @IsOptional()
    id?: string;

    @ApiPropertyOptional({ type: String, format: 'uuid' })
    @IsUUID()
    @ValidateIf((o) => !o.id)
    accountId?: string;

    @ApiPropertyOptional({ type: String, format: 'date-time' })
    @IsDateString()
    @IsOptional()
    date?: string;

    @ApiPropertyOptional({ enum: UpdateStatusEnum })
    @IsEnum(UpdateStatusEnum)
    status: EAttendanceStatus | null;

    @ApiPropertyOptional({ type: String, format: 'date-time' })
    @IsOptional()
    @IsDateString()
    inTime?: string;

    @ApiPropertyOptional({ type: String, format: 'date-time' })
    @IsOptional()
    @IsDateString()
    outTime?: string;
}

export class UpdateAttendanceBatchDto {
    @IsArray()
    @ArrayMinSize(1)
    @IsDefined()
    @ValidateNested({ each: true })
    @Type(() => UpdateAttendanceDto)
    updatedAttendances: UpdateAttendanceDto[];
}