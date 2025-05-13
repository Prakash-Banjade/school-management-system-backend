import { BadRequestException } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayMinSize, IsEnum, IsMilitaryTime, IsNotEmpty, IsOptional, IsUUID, ValidateIf } from "class-validator";
import { differenceInMinutes, isAfter, parse } from "date-fns";
import { EDayOfWeek, ERoutineType } from "src/common/types/global.type";

export class CreateClassRoutineDto {
    @ApiProperty({ enum: EDayOfWeek, isArray: true, description: 'Days of the week' })
    @IsEnum(EDayOfWeek, { each: true })
    @ArrayMinSize(1, { message: 'At least one day of the week is required' })
    daysOfTheWeek: EDayOfWeek[];

    @ApiProperty({ type: 'string', description: 'Start time' })
    @IsNotEmpty()
    @IsMilitaryTime({ message: "Invalid start time. Required format: HH:MM" })
    startTime: string;

    @ApiProperty({ type: 'string', description: 'End time' })
    @IsNotEmpty()
    @IsMilitaryTime({ message: "Invalid end time. Required format: HH:MM" })
    @ValidateIf((o: CreateClassRoutineDto) => {
        if (!o.startTime || !o.endTime) throw new BadRequestException('Start time and end time are required');

        const startTime = parse(o.startTime, 'HH:mm', new Date());
        const endTime = parse(o.endTime, 'HH:mm', new Date());
        if (isAfter(startTime, endTime)) throw new BadRequestException('End time must be greater than start time');
        if (differenceInMinutes(endTime, startTime) < 10) throw new BadRequestException('At least 10 minutes difference is required');

        return true;
    })
    endTime: string;

    @ApiProperty({ enum: ERoutineType, description: 'Type of the routine' })
    @IsNotEmpty()
    @IsEnum(ERoutineType)
    type: ERoutineType = ERoutineType.CLASS;

    @ApiProperty({ format: 'uuid', description: 'Class room ID' })
    @IsNotEmpty()
    @IsUUID()
    classRoomId: string;

    @ApiPropertyOptional({ format: 'uuid', description: 'Subject ID' })
    @IsUUID()
    @ValidateIf((o) => o.type === ERoutineType.CLASS)
    subjectId?: string;

    @ApiPropertyOptional({ format: 'uuid', description: 'Teacher ID' })
    @IsUUID()
    @IsOptional()
    teacherId?: string;
}
