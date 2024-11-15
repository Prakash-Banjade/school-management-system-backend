import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsUUID, ValidateNested } from "class-validator";

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

class OptionalSubjectSelection {
    @ApiProperty({ format: "uuid" })
    @IsUUID()
    subjectId: string;

    @ApiProperty({ format: "uuid", isArray: true })
    @IsArray()
    @IsUUID('all', { each: true })
    studentIds: string[];
}

export class AssignOptionalSubjectDto {
    @ApiProperty({ format: "uuid", isArray: true })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => OptionalSubjectSelection)
    selections: OptionalSubjectSelection[];
}