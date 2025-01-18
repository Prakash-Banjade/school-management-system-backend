import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsDateString, IsInt, IsNotEmpty, IsNumber, IsUUID, Min, ValidateNested } from "class-validator";
import { IsNotFutureDate } from "src/common/decorators/validators/isNotFutureDate.decorator";

class StudentWithRollNo {
    @ApiProperty({ type: String, format: 'uuid' })
    @IsUUID()
    studentId: string;

    @ApiProperty({ type: Number, example: 10, description: 'Roll number of the student' })
    @IsNotEmpty()
    @IsInt()
    @Min(1, { message: 'Roll number must be greater than 0' })
    newRollNo: number;
}

export class CreateEnrollmentDto {
    @ApiProperty({ type: [StudentWithRollNo], description: 'Students with roll number' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => StudentWithRollNo)
    @ArrayMinSize(1, { message: "At least one student is required" })
    studentsWithRollNo: StudentWithRollNo[];

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    classRoomId: string;

    @ApiProperty({ format: 'date-time', example: '2022-01-01T00:00:00.000Z' })
    @IsDateString()
    @IsNotFutureDate()
    enrollmentDate: string;
}

