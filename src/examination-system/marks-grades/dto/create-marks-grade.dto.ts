import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateMarksGradeDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    gradeName: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    gpa: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    @Max(99)
    percentFrom: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    @Max(100)
    percentTo: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    gpaFrom: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    gpaTo: number;

    @ApiProperty()
    @IsOptional()
    @IsString()
    description: string;
}
