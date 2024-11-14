import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { ClassWithSectionQueryDto } from "src/common/dto/classWithSectionQuery.dto";

export enum StudentSortBy {
    NAME = "name",
    ROLL_NO = "rollNo",
    CLASS_ROOM = "classRoomName",
    SUB_CLASS = "subClassName",
    GENDER = "gender",
    DOB = "dob",
    STUDENT_ID = "studentId",
}

export class StudentQueryDto extends ClassWithSectionQueryDto {
    @ApiPropertyOptional({ type: String, description: 'Search by student ID' })
    @IsOptional()
    studentId: string;

    @ApiPropertyOptional({ type: String, description: 'Search by roll no', example: '44' })
    @IsString()
    @IsOptional()
    rollNo: string;

    @ApiPropertyOptional({ type: 'enum', enum: StudentSortBy, description: 'Sort By Key' })
    @IsOptional()
    @IsEnum(StudentSortBy)
    sortBy: string;
}