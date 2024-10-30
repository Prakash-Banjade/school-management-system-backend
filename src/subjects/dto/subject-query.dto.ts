import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class SubjectQueryDto extends QueryDto {
    @ApiPropertyOptional({ type: String })
    @IsOptional()
    @IsString()
    subjectCode: string;

    @ApiPropertyOptional({ type: String, format: 'uuid' })
    @IsUUID()
    @IsOptional()
    classRoomId: string;
}

export class SubjectOptionsQueryDto {

    @ApiPropertyOptional({ type: String, format: 'uuid' })
    @IsUUID()
    classRoomId: string;
}