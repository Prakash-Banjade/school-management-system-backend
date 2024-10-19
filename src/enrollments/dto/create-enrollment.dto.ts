import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty, IsUUID } from "class-validator";

export class CreateEnrollmentDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    @IsNotEmpty()
    studentId: string;

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    @IsNotEmpty()
    classRoomId: string;

    @ApiProperty({ format: 'date-time', example: '2022-01-01T00:00:00.000Z' })
    @IsNotEmpty()
    @IsDateString()
    enrollmentDate: string
}

