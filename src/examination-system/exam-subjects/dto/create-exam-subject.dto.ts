import { BadRequestException } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsDateString, IsInt, IsMilitaryTime, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from "class-validator";
import { differenceInDays } from "date-fns";
import { IsFutureDate } from "src/common/decorators/validators/isFutureDate.decorator";
import { SubjectMarksDto } from "src/subjects/dto/create-subject.dto";

export class CreateExamSubjectDto extends SubjectMarksDto {
    @ApiProperty({ format: 'date-time' })
    @IsDateString()
    @IsFutureDate({ message: "Exam date must be in the future" })
    @Transform(({ value }) => {
        if (isNaN(Date.parse(value))) throw new BadRequestException('Invalid date');

        const diff = differenceInDays(new Date(value), new Date());

        if (diff > 90) throw new BadRequestException("Exam date cannot be more than 90 days from today");

        return value;
    })
    examDate: string;

    @ApiProperty({ format: 'date-time' })
    @IsMilitaryTime({ message: 'Invalid start time. Time must be in format HH:MM' })
    @IsNotEmpty()
    startTime: string;

    @ApiProperty()
    @IsInt({ message: 'Duration must be a number' })
    @Min(0)
    duration: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    venue?: string;

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    @IsNotEmpty()
    examId: string;

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    @IsNotEmpty()
    subjectId: string;
}
