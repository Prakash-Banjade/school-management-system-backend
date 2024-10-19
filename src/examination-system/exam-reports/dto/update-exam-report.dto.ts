import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class UpdateExamReportDto {
    @ApiProperty({ type: Number, minimum: 0 })
    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    obtainedMarks: number;
}
