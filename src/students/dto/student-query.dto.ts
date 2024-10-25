import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { ClassWithSectionQueryDto } from "src/common/dto/classWithSectionQuery.dto";

export enum StudentSortBy {
    NAME = "name",
    ROLL_NO = "rollNo",
    CLASS_ROOM = "classRoomName",
    SUB_CLASS = "subClassName",
    GENDER = "gender",
    DOB = "dob",
}

export class StudentQueryDto extends ClassWithSectionQueryDto {
    @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Search by academic year id' })
    @IsUUID()
    @IsOptional()
    academicYearId: string;

    @ApiPropertyOptional({ type: String, description: 'Search by roll no', example: '44' })
    @IsString()
    @IsOptional()
    rollNo: string;

    @ApiPropertyOptional({ type: 'enum', enum: StudentSortBy, description: 'Sort By Key' })
    @IsOptional()
    @IsEnum(StudentSortBy)
    sortBy: string;
}