import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsInt, IsMilitaryTime, IsNotEmpty, IsNumber, IsString, IsUUID, Min, ValidateIf } from "class-validator";
import { IsFutureDate } from "src/common/decorators/isFutureDate.decorator";

export class CreateExamSubjectDto {
    @ApiProperty({ format: 'date-time' })
    @IsDateString()
    @IsFutureDate()
    examDate: string;

    @ApiProperty({ format: 'date-time' })
    @IsMilitaryTime({ message: 'Invalid start time. Time must be in format HH:MM' })
    @IsNotEmpty()
    startTime: string;

    @ApiProperty()
    @IsInt({ message: 'Duration must be a number' })
    duration: number;

    @ApiProperty({ type: Number })
    @IsInt()
    @Min(1, { message: 'Full mark must be a number greater than 0' })
    fullMark: number;

    @ApiProperty({ type: Number })
    @IsInt()
    @Min(1, { message: 'Pass mark must be a number greater than 0' })
    @ValidateIf((dto: CreateExamSubjectDto) => dto.fullMark >= dto.passMark, { message: 'Full mark must be greater than or equal to pass mark' })
    passMark: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    venue: string;

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    @IsNotEmpty()
    examId: string;

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    @IsNotEmpty()
    subjectId: string;
}
