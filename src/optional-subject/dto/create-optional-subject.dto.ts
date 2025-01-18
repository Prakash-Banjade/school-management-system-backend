import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsBoolean, IsUUID, ValidateNested } from "class-validator";

export class StudentIdWithCheckStatus {
    @ApiProperty({ type: "string", format: "uuid" })
    @IsUUID()
    id: string;

    @ApiProperty({ type: Boolean })
    @IsBoolean()
    isChecked: boolean
}

class OptionalSubjectSelection {
    @ApiProperty({ type: "string", format: "uuid" })
    @IsUUID()
    optionalSubjectId: string;

    @ApiProperty({ type: StudentIdWithCheckStatus, isArray: true })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => StudentIdWithCheckStatus)
    studentIds: StudentIdWithCheckStatus[];
}

export class AssignOptionalSubjectDto {
    @ApiProperty({ format: "uuid", isArray: true })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => OptionalSubjectSelection)
    selections: OptionalSubjectSelection[];
}