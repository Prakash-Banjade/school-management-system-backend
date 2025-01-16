import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString, IsUUID } from "class-validator";
import { ClassRoomSearchQueryDto } from "src/common/dto/classRoomSearchQueryDto";
import { QueryDto } from "src/common/dto/query.dto";

const subjectSortByQuery = {
    name: 'subject.subjectName',
}

export class SubjectQueryDto extends ClassRoomSearchQueryDto {
    @ApiPropertyOptional({ type: String, format: 'uuid' })
    @IsUUID()
    @IsOptional()
    classRoomId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Transform(({ value }) => {
        if (value in subjectSortByQuery) return subjectSortByQuery[value];
        return 'subject.createdAt';
    })
    sortBy?: string = 'subject.createdAt';

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ each: true })
    @Transform(({ value }) => {
        if (value) return value.split(',');
        return [];
    })
    types?: string[];
}

export class SubjectOptionsQueryDto extends QueryDto {

    @ApiPropertyOptional({ type: String, format: 'uuid' })
    @IsUUID()
    classRoomId: string;
}