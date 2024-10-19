import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty, IsNumber, IsString, IsUUID } from "class-validator";

export class CreateExamSubjectDto {
    @ApiProperty({ format: 'date-time' })
    @IsNotEmpty()
    @IsDateString()
    examDate: string;

    @ApiProperty({ format: 'date-time' })
    @IsNotEmpty()
    @IsDateString()
    startTime: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    duration: string;

    @ApiProperty({ type: Number })
    @IsNotEmpty()
    @IsNumber()
    fullMark: number;

    @ApiProperty({ type: Number })
    @IsNotEmpty()
    @IsNumber()
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
