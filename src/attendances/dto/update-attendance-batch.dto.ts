import { BadRequestException } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsDateString, IsDefined, IsEnum, IsMilitaryTime, IsOptional, IsUUID, ValidateIf, ValidateNested } from "class-validator";
import { compareAsc, parse } from "date-fns";
import { IsNotFutureDate } from "src/common/decorators/validators/isNotFutureDate.decorator";
import { EAttendanceStatus } from "src/common/types/global.type";

const UpdateStatusEnum = [...Object.values(EAttendanceStatus), null];

class UpdateAttendanceDto {
    @ApiPropertyOptional({ type: "string", format: 'uuid' })
    @IsUUID()
    @IsOptional()
    id?: string;

    @ApiPropertyOptional({ type: "string", format: 'uuid' })
    @IsUUID()
    @ValidateIf((o) => !o.id)
    accountId?: string;

    @ApiPropertyOptional({ type: "string", format: 'date-time' })
    @IsDateString()
    @IsNotFutureDate({ message: 'Cannot make attendance in the future' })
    @IsOptional()
    date?: string;

    @ApiPropertyOptional({ enum: UpdateStatusEnum })
    @IsEnum(UpdateStatusEnum)
    @IsOptional()
    status?: EAttendanceStatus | null;

    @ApiPropertyOptional({ type: "string", format: 'date-time' })
    @IsOptional()
    @IsMilitaryTime({ message: 'Invalid in time. Time must be in format HH:MM' })
    inTime?: string | null;

    @ApiPropertyOptional({ type: "string", format: 'date-time' })
    @IsOptional()
    @IsMilitaryTime({ message: 'Invalid out time. Time must be in format HH:MM' })
    @ValidateIf((o: UpdateAttendanceDto) => {
        if (o.inTime && o.outTime) {
            const inTimeDate = parse(o.inTime, 'HH:mm', new Date());
            const outTimeDate = parse(o.outTime, 'HH:mm', new Date());

            if (compareAsc(inTimeDate, outTimeDate) > 0) throw new BadRequestException('Out time must be greater than in time');
        }

        return true;
    })
    outTime?: string | null;
}

export class UpdateAttendanceBatchDto {
    @ApiProperty({ type: [UpdateAttendanceDto], isArray: true, description: 'Updated attendances' })
    @IsArray()
    @ArrayMinSize(1)
    @IsDefined()
    @ValidateNested({ each: true })
    @Type(() => UpdateAttendanceDto)
    updatedAttendances: UpdateAttendanceDto[];
}