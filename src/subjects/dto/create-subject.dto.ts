import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class CreateSubjectDto {
    @ApiProperty({ type: String, description: 'Subject name' })
    @IsString()
    @IsNotEmpty()
    subjectName: string;

    @ApiProperty({ type: String, description: 'Subject code' })
    @IsString()
    @IsNotEmpty()
    subjectCode: string;

    @ApiProperty({ type: String, description: 'Subject description' })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({ type: Number, description: 'Theory pass marks' })
    @IsInt()
    @IsNotEmpty()
    @Min(0)
    theoryPM: number;

    @ApiProperty({ type: Number, description: 'Theory full marks' })
    @IsInt()
    @IsNotEmpty()
    @Min(0)
    theoryFM: number;

    @ApiProperty({ type: Number, description: 'Practical pass marks' })
    @IsInt()
    @IsNotEmpty()
    @Min(0)
    practicalPM: number;

    @ApiProperty({ type: Number, description: 'Practical full marks' })
    @IsInt()
    @IsNotEmpty()
    @Min(0)
    practicalFM: number;

    @ApiPropertyOptional({ type: 'enum', format: 'emum', description: 'Class room id' })
    @IsUUID()
    @IsOptional()
    classRoomId?: string;

    @ApiPropertyOptional({ type: 'enum', format: 'emum', description: 'Teacher id' })
    @IsUUID()
    @IsOptional()
    teacherId?: string;
}
