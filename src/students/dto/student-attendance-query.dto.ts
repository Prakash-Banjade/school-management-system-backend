import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsUUID } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

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