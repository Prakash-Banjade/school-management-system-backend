import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID } from "class-validator";
import { ClassRoomSearchQueryDto } from "src/common/dto/classRoomSearchQueryDto";
import { QueryDto } from "src/common/dto/query.dto";

const studentSortByQuery = {
    name: "fullName",
    rollNo: "student.rollNo",
    studentId: "student.studentId",
    gender: "student.gender",
    dob: "student.dob",
    amount: "ledger.amount",
}

export class StudentQueryDto extends ClassRoomSearchQueryDto {
    @ApiPropertyOptional({ type: String, description: 'Search by student ID' })
    @IsOptional()
    studentId?: string;

    @ApiPropertyOptional({ type: String, description: 'Search by roll no', example: '44' })
    @IsString()
    @IsOptional()
    rollNo?: string;

    @ApiPropertyOptional({ type: 'enum', description: 'Sort By Key' })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => {
        if (value in studentSortByQuery) return studentSortByQuery[value];
        return 'student.createdAt';
    })
    sortBy?: string;

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

export class PastStudentsQueryDto extends ClassRoomSearchQueryDto {
    @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Academic year id' })
    @IsUUID()
    @IsOptional()
    academicYearId?: string;

    @ApiPropertyOptional({ type: String, description: 'Search by student ID' })
    @IsOptional()
    studentId: string;
}