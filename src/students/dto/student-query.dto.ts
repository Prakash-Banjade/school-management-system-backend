import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID } from "class-validator";
import { ClassRoomSearchQueryDto } from "src/common/dto/classRoomSearchQueryDto";
import { QueryDto } from "src/common/dto/query.dto";

const studentSortByQuery = {
    name: "account.lowerCasedFullName",
    rollNo: "student.rollNo",
    studentId: "student.studentId",
    gender: "student.gender",
    dob: "student.dob",
    amount: "ledger.amount",
}

export class StudentQueryDto extends ClassRoomSearchQueryDto {
    @ApiPropertyOptional({ type: "string", description: 'Search by student ID' })
    @IsOptional()
    studentId?: string;

    @ApiPropertyOptional({ type: "string", description: 'Search by roll no', example: '44' })
    @IsString()
    @IsOptional()
    rollNo?: string;

    @ApiPropertyOptional({ type: 'string', description: 'Sort By Key' })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => {
        if (value in studentSortByQuery) return studentSortByQuery[value];
        return 'student.createdAt';
    })
    sortBy?: string;

    @ApiPropertyOptional({ type: "boolean", description: 'Include ledger amount flag', default: false })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    includeLedgerAmount?: boolean;
}

export class StudentAttendanceQueryDto extends QueryDto {
    @ApiProperty({ type: "string", format: 'uuid', description: 'Class room id' })
    @IsUUID()
    classRoomId: string;

    @ApiProperty({ type: "string", format: 'uuid', description: 'Section id' })
    @IsUUID()
    @IsOptional()
    sectionId?: string;

    @ApiProperty({ type: "string", format: 'date', description: 'Date' })
    @IsDateString()
    date: string;
}

export class PastStudentsQueryDto extends ClassRoomSearchQueryDto {
    @ApiProperty({ type: "string", format: 'uuid', description: 'Academic year id' })
    @IsUUID()
    academicYearId: string;
}