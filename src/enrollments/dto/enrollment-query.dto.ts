import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { ClassWithSectionQueryDto } from "src/common/dto/classWithSectionQuery.dto";

export class EnrollmentQueryDto extends ClassWithSectionQueryDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    dateFrom?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    dateTo?: string;
}