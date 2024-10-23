import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsMilitaryTime, IsNotEmpty, IsString, IsUUID, ValidateIf } from "class-validator";
import { EDayOfWeek, ERoutineType } from "src/common/types/global.type";

export class CreateClassRoutineDto {
    @ApiProperty({ enum: EDayOfWeek })
    @IsNotEmpty()
    @IsEnum(EDayOfWeek)
    dayOfTheWeek: EDayOfWeek;

    @ApiProperty()
    @IsNotEmpty()
    @IsMilitaryTime({message: "Invalid start time. Required format: HH:MM"})
    startTime: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsMilitaryTime({message: "Invalid end time. Required format: HH:MM"})
    endTime: string;

    @ApiProperty({ enum: ERoutineType })
    @IsNotEmpty()
    @IsEnum(ERoutineType)
    type: ERoutineType;

    @ApiProperty({ format: 'uuid' })
    @IsNotEmpty()
    @IsUUID()
    classRoomId: string;

    @ApiProperty({ format: 'uuid' })
    @IsNotEmpty()
    @IsUUID()
    @ValidateIf((o) => o.type === ERoutineType.CLASS)
    subjectId: string;
}
