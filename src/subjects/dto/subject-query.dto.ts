import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsString, IsUUID } from "class-validator";
import { ClassRoomSearchQueryDto } from "src/common/dto/classRoomSearchQueryDto";
import { QueryDto } from "src/common/dto/query.dto";

const subjectSortByQuery = {
    subjectName: 'subject.subjectName',
}

export class SubjectQueryDto extends ClassRoomSearchQueryDto {
    @ApiPropertyOptional({ type: "string", format: 'uuid' })
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

    @ApiPropertyOptional({ type: 'boolean', default: false, description: 'As options flag' })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    asOptions: boolean = false
}

export class SubjectOptionsQueryDto extends QueryDto {

    @ApiPropertyOptional({ type: "string", format: 'uuid' })
    @IsUUID()
    classRoomId: string;
}

