import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsString, IsUUID } from "class-validator";
import { ClassRoomSearchQueryDto } from "src/common/dto/classRoomSearchQueryDto";

export class ExamQueryDto extends ClassRoomSearchQueryDto {
    @ApiPropertyOptional({ isArray: true, type: [String], description: 'Exam type name array' })
    @IsString({ each: true })
    @IsOptional()
    @Transform(({ value }) => {
        if (value) return value.split(',');
        return [];
    })
    examTypes?: string[]; // exam type name array

    @ApiPropertyOptional({ type: Boolean, default: false, description: 'Include exam subjects flag' })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    includeExamSubjects?: boolean = false;

    @ApiPropertyOptional({ type: Boolean, default: false, description: 'Only past exams flag' })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    onlyPast?: boolean = false
}

export class ExamReportByStudentQueryDto {
    @ApiPropertyOptional({ type: String, description: 'Student id' })
    @IsString()
    @IsOptional()
    studentId: string;

    @ApiProperty({ type: "string", format: 'uuid', description: 'Exam type id' })
    @IsUUID()
    examTypeId: string;
}

export class ExamStudentsQueryDto {
    @ApiPropertyOptional({ type: "string", format: 'uuid', description: 'Exam type id' })
    @IsUUID()
    @IsOptional()
    optionalSubjectId?: string;
}