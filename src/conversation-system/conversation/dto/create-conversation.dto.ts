import { ApiProperty } from "@nestjs/swagger";
import { IsUUID, ValidateIf } from "class-validator";

export class CreateConversationDto {
    @ApiProperty()
    @IsUUID()
    @ValidateIf((o: CreateConversationDto) => !o.teacherId)
    studentId: string;

    @ApiProperty()
    @IsUUID()
    @ValidateIf((o: CreateConversationDto) => !o.studentId)
    teacherId: string;
}
