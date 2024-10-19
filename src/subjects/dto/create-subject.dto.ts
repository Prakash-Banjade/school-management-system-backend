import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

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

    @ApiProperty({ type: Number, description: 'Total marks' })
    @IsInt()
    @IsNotEmpty()
    totalMarks: number;

    @ApiPropertyOptional({ type: 'enum', format: 'emum', description: 'Class room id' })
    @IsUUID()
    @IsOptional()
    classRoomId?: string;

    @ApiPropertyOptional({ type: 'enum', format: 'emum', description: 'Teacher id' })
    @IsUUID()
    @IsOptional()
    teacherId?: string;
}
