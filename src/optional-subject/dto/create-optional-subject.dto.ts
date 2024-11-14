import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class CreateOptionalSubjectDto {
    @ApiProperty({ format: "uuid" })
    @IsUUID()
    classRoomId: string;

    @ApiProperty({ format: "uuid" })
    @IsUUID()
    subjectId: string;

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    studentId: string;
}

export class AssignOptionalSubjectStudentsDto {
    
}