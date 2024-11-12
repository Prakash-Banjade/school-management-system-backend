import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsString, IsUUID } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class ExamSubjectQueryDto extends QueryDto {
    @ApiPropertyOptional({ format: 'uuid' })
    @IsOptional()
    @IsUUID()
    examId?: string;

    @ApiPropertyOptional({ type: Boolean, default: false })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    onlyPast?: boolean = false;

    @ApiPropertyOptional({ format: 'uuid' })
    @IsOptional()
    @IsString()
    classRoomId?: string;

    @ApiPropertyOptional({ format: 'uuid' })
    @IsOptional()
    @IsString()
    examTypeId?: string;

    @ApiPropertyOptional({ type: Boolean, default: false })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    asOptions?: boolean;
}