import { BadRequestException } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsInt, IsMilitaryTime, IsNotEmpty, IsNumber, IsString, IsUUID, Min, ValidateIf } from "class-validator";
import { IsFutureDate } from "src/common/decorators/isFutureDate.decorator";
import { SubjectMarksDto } from "src/subjects/dto/create-subject.dto";

export class CreateExamSubjectDto extends SubjectMarksDto {
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

    @ApiProperty()
    @IsNumber()
    @Min(0)
    theoryPM: number;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    theoryFM: number;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    practicalPM: number;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    practicalFM: number;

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
