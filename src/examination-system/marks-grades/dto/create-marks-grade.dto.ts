import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, Min } from "class-validator";
import { GRADE_REGEX } from "src/common/CONSTANTS";

export class CreateMarksGradeDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @Matches(GRADE_REGEX)
    gradeName: string;

    @ApiProperty()
    @IsInt()
    @Min(1)
    gradeScale: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    @Min(0, { message: 'Percent from cannot be less than 0' })
    @Max(99, { message: 'Percent from cannot be greater than 99' })
    percentFrom: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    @Min(0, { message: 'Percent to cannot be less than 0' })
    @Max(100, { message: 'Percent to cannot be greater than 100' })
    percentTo: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description: string;
}
