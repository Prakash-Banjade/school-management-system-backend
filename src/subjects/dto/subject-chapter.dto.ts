import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";
import { ESubjectChapterPriority } from "src/common/types/global.type";

export class CreateSubjectChapterDto {
    @ApiProperty({ type: String, description: 'Chapter title' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ type: String, description: 'Chapter content' })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiPropertyOptional({ type: 'enum', enum: ESubjectChapterPriority, description: 'Chapter priority', default: ESubjectChapterPriority.MEDIUM })
    @IsEnum(ESubjectChapterPriority)
    @IsOptional()
    priority: ESubjectChapterPriority

    @ApiProperty({ type: String, format: 'uuid', description: 'Subject id' })
    @IsNotEmpty()
    @IsUUID()
    subjectId: string;
}

export class UpdateSubjectChapterDto extends PartialType(OmitType(CreateSubjectChapterDto, ['subjectId'])) { }

export class SubjectChapterQueryDto extends QueryDto {
    @ApiPropertyOptional({ type: String, description: 'Subject id' })
    @IsOptional()
    @IsUUID()
    subjectId: string;
}