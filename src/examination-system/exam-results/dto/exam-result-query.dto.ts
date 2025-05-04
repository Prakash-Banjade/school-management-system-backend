import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsUUID } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class ExamResultQueryDto extends QueryDto {
    @ApiProperty({ type: "string", description: 'Class room ID' })
    @IsUUID()
    classRoomId: string;

    @ApiPropertyOptional({ type: "string", description: 'Section ID' })
    @IsUUID()
    @IsOptional()
    sectionId?: string;

    @ApiProperty({ type: "string", description: 'Exam type ID' })
    @IsUUID()
    examTypeId: string;
}