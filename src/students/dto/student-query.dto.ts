import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export enum StudentSortBy {
    NAME = "name",
    ROLL_NO = "rollNo",
    CLASS_ROOM = "classRoomName",
    SUB_CLASS = "subClassName",
    GENDER = "gender",
}

export class StudentQueryDto extends QueryDto {
    @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Search by academic year id' })
    @IsUUID()
    @IsOptional()
    academicYearId: string;

    @ApiPropertyOptional({ type: String, description: 'Search by classRoom name' })
    @IsString()
    @IsOptional()
    classRoomName: string;

    @ApiPropertyOptional({ type: String, description: 'Search by exact classRoom name', example: 'Section A' })
    @IsString()
    @IsOptional()
    subClassName: string;

    @ApiPropertyOptional({ type: String, description: 'Search by roll no', example: '44' })
    @IsString()
    @IsOptional()
    rollNo: string;

    @ApiPropertyOptional({ type: 'enum', enum: StudentSortBy, description: 'Sort By Key' })
    @IsOptional()
    @IsEnum(StudentSortBy)
    sortBy: string;
}