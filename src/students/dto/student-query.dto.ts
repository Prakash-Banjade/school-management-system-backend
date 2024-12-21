import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { ClassWithSectionQueryDto } from "src/common/dto/classWithSectionQuery.dto";
import { QueryDto } from "src/common/dto/query.dto";

export enum StudentSortBy {
    NAME = "name",
    ROLL_NO = "rollNo",
    CLASS_ROOM = "classRoomName",
    SUB_CLASS = "subClassName",
    GENDER = "gender",
    DOB = "dob",
    STUDENT_ID = "studentId",
    LEDGER_AMOUNT = "ledgerAmount",
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

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    includeLedgerAmount?: boolean;
}

export class StudentAttendanceQueryDto extends QueryDto {
    @ApiProperty({ type: String, format: 'uuid', description: 'Class room id' })
    @IsUUID()
    classRoomId: string;

    @ApiProperty({ type: String, format: 'uuid', description: 'Section id' })
    @IsUUID()
    @IsOptional()
    sectionId?: string;

    @ApiProperty({ type: String, format: 'date', description: 'Date' })
    @IsDateString()
    date: string;
}

export class PastStudentsQueryDto extends ClassWithSectionQueryDto {
    @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Academic year id' })
    @IsUUID()
    @IsOptional()
    academicYearId?: string;

    @ApiPropertyOptional({ type: String, description: 'Search by student ID' })
    @IsOptional()
    studentId: string;
}