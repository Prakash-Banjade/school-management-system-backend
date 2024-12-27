import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class TeacherQueryDto extends QueryDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    teacherId?: string;
}

export class TeacherOptionsQueryDto extends QueryDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    assignedSubjectId?: string;
}