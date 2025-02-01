import { BadRequestException, ConflictException } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, Length } from "class-validator";
import { SCHOOL_LEVEL_FACULTY_NAME } from "src/common/CONSTANTS";

export class CreateFacultyDto {
    @ApiProperty({ description: 'Name of the faculty', example: 'Computer Science' })
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => {
        if (typeof value !== 'string') throw new BadRequestException('Name must be a string');

        if (value.toLowerCase() === SCHOOL_LEVEL_FACULTY_NAME.toLowerCase()) throw new ConflictException('School level faculty already exists');

        return value.trim();
    })
    name: string;

    @ApiPropertyOptional({ description: 'Description of the faculty', example: 'Computer Science' })
    @IsString()
    @IsOptional()
    @Length(0, 500, { message: 'Description must be less than 500 characters' })
    @Transform(({ value }) => {
        return value ? value.trim() : value;
    })
    description?: string;
}