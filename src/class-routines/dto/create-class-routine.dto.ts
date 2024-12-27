import { BadRequestException } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsMilitaryTime, IsNotEmpty, IsOptional, IsUUID, ValidateIf } from "class-validator";
import { differenceInMinutes, isAfter, parse } from "date-fns";
import { EDayOfWeek, ERoutineType } from "src/common/types/global.type";

export class CreateClassRoutineDto {
    @ApiProperty({ enum: EDayOfWeek })
    @IsNotEmpty()
    @IsEnum(EDayOfWeek)
    dayOfTheWeek: EDayOfWeek;

    @ApiProperty()
    @IsNotEmpty()
    @IsMilitaryTime({ message: "Invalid start time. Required format: HH:MM" })
    startTime: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsMilitaryTime({ message: "Invalid end time. Required format: HH:MM" })
    @ValidateIf((o) => {
        const startTime = parse(o.startTime, 'HH:mm', new Date());
        const endTime = parse(o.endTime, 'HH:mm', new Date());
        if (isAfter(startTime, endTime)) throw new BadRequestException('End time must be greater than start time');
        if (differenceInMinutes(endTime, startTime) < 10) throw new BadRequestException('At least 10 minutes difference is required');

        return true;
    })
    endTime: string;

    @ApiProperty({ enum: ERoutineType })
    @IsNotEmpty()
    @IsEnum(ERoutineType)
    type: ERoutineType = ERoutineType.CLASS;

    @ApiProperty({ format: 'uuid' })
    @IsNotEmpty()
    @IsUUID()
    classRoomId: string;

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    @ValidateIf((o) => o.type === ERoutineType.CLASS)
    subjectId?: string;

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    @IsOptional()
    teacherId?: string;
}
