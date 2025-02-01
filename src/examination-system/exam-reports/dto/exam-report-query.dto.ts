import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class ExamReportQueryDto extends QueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    examSubjectId?: string;
}

export class ExamReportBySubjectQueryDto extends QueryDto {
    @ApiProperty()
    @IsUUID()
    classRoomId: string;

    @ApiProperty()
    @IsUUID()
    examSubjectId: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    sectionId?: string;
}