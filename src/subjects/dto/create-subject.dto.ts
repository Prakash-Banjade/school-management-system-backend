import { BadRequestException } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Length, Min, ValidateIf } from "class-validator";
import { ESubjectType } from "src/common/types/global.type";

export class SubjectMarksDto {
    @ApiProperty({ type: Number, description: 'Theory full marks' })
    @IsInt()
    @Min(1)
    theoryFM: number;

    @ApiProperty({ type: Number, description: 'Theory pass marks' })
    @IsInt()
    @Min(1)
    @ValidateIf((o: SubjectMarksDto) => {
        if (o.theoryFM < o.theoryPM) throw new BadRequestException('Theory full mark must be greater than theory pass mark');
        return true;
    })
    theoryPM: number;

    @ApiProperty({ type: Number, description: 'Practical full marks' })
    @IsInt()
    @Min(0)
    practicalFM: number;

    @ApiProperty({ type: Number, description: 'Practical pass marks' })
    @IsInt()
    @Min(0)
    @ValidateIf((o: SubjectMarksDto) => {
        if (o.practicalFM < o.practicalPM) throw new BadRequestException('Practical full mark must be greater than practical pass mark');
        return true;
    })
    practicalPM: number;
}

export class CreateSubjectDto extends SubjectMarksDto {
    @ApiProperty({ type: String, description: 'Subject name' })
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => value?.trim())
    subjectName: string;

    @ApiProperty({ type: String, description: 'Subject code' })
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => value?.trim())
    subjectCode: string;

    @ApiProperty({ type: String, description: 'Subject description' })
    @IsString()
    @IsNotEmpty()
    @Length(0, 500, { message: 'Description must be less than 500 characters' })
    @Transform(({ value }) => value?.trim())
    content: string;

    @ApiProperty({ type: 'string', enum: ESubjectType, description: 'Subject type' })
    @IsEnum(ESubjectType)
    type: ESubjectType;

    @ApiProperty({ type: 'string', format: 'emum', description: 'Class room id' })
    @IsUUID()
    classRoomId: string;

    @ApiPropertyOptional({ type: 'string', format: 'emum', description: 'Teacher id' })
    @IsUUID('all', { each: true })
    @IsOptional()
    teacherIds?: string[];
}