import { BadRequestException } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
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
    @Transform(({ value }) => {
        if (Array.isArray(value)) return Array.from(new Set(value));
        throw new BadRequestException('Student ids must be an array');
    })
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