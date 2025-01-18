import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsString, IsUUID } from "class-validator";
import { ClassRoomSearchQueryDto } from "src/common/dto/classRoomSearchQueryDto";

export class ExamQueryDto extends ClassRoomSearchQueryDto {
    @ApiPropertyOptional({ isArray: true })
    @IsString({ each: true })
    @IsOptional()
    @Transform(({ value }) => {
        if (value) return value.split(',');
        return [];
    })
    examTypes?: string[]; // exam type name array

    @ApiPropertyOptional({ type: Boolean, default: false })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    includeExamSubjects?: boolean = false;

    @ApiPropertyOptional({ type: Boolean, default: false })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    onlyPast?: boolean = false
}

export class ExamReportByStudentQueryDto {
    @ApiPropertyOptional({ type: String })
    @IsString()
    @IsOptional()
    studentId: string;

    @ApiProperty({ type: "string", format: 'uuid' })
    @IsUUID()
    examTypeId: string;
}

export class ExamStudentsQueryDto {
    @ApiPropertyOptional({ type: "string", format: 'uuid' })
    @IsUUID()
    @IsOptional()
    optionalSubjectId?: string;
}