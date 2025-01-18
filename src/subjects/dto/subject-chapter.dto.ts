import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";
import { ESubjectChapterPriority } from "src/common/types/global.type";

export class CreateSubjectChapterDto {
    @ApiProperty({ type: "string", description: 'Chapter title' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ type: "string", description: 'Chapter content' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(1000, { message: 'Chapter content should not exceed 1000 characters' })
    content: string;

    @ApiPropertyOptional({ type: 'string', enum: ESubjectChapterPriority, description: 'Chapter priority', default: ESubjectChapterPriority.MEDIUM })
    @IsEnum(ESubjectChapterPriority)
    @IsOptional()
    priority: ESubjectChapterPriority

    @ApiProperty({ type: "string", format: 'uuid', description: 'Subject id' })
    @IsNotEmpty()
    @IsUUID()
    subjectId: string;
}

export class UpdateSubjectChapterDto extends PartialType(OmitType(CreateSubjectChapterDto, ['subjectId'])) { }

export class SubjectChapterQueryDto extends QueryDto {
    @ApiPropertyOptional({ type: "string", description: 'Subject id' })
    @IsOptional()
    @IsUUID()
    subjectId: string;
}

class UpdatedChapterNo {
    @ApiProperty({ type: "string", format: 'uuid', description: 'Chapter id' })
    @IsUUID()
    id: string;

    @ApiProperty({ type: Number, description: 'Chapter chapterNo' })
    @IsInt()
    @Min(1)
    chapterNo: number;
}

export class UpdateChapterNoDto {
    @ApiProperty({ type: [UpdatedChapterNo], description: 'Chapters', isArray: true })
    @ValidateNested({each: true})
    @Type(() => UpdatedChapterNo)
    @IsArray()
    @ArrayMinSize(1)
    chapters: UpdatedChapterNo[];
}