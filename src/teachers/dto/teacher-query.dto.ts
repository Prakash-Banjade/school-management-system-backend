import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class TeacherQueryDto extends QueryDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    teacherId?: string;

    @ApiPropertyOptional()
    @IsString({ each: true })
    @IsOptional()
    @Transform(({ value }) => {
        return value?.split(',') ?? [];
    })
    departmentIds?: string[] = [];
}

export class TeacherOptionsQueryDto extends QueryDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    assignedSubjectId?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    facultyId?: string;
}