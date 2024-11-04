import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class AcademicYearOptionsDto extends QueryDto {
    @ApiPropertyOptional({ type: Boolean, default: false, description: "With active flag" })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    withActive: boolean;
}