import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsUUID, Min } from "class-validator";

export class CreateExamReportDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    @IsNotEmpty()
    examSubjectId: string;

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    @IsNotEmpty()
    studentId: string;

    @ApiProperty({ type: Number, minimum: 0 })
    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    obtainedMarks: number;
}
