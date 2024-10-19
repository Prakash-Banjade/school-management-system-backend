import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { QueryDto } from "src/core/dto/query.dto";
import { ESalaryStatus } from "src/core/types/global.types";

export class SalaryQueryDto extends QueryDto {
    @ApiPropertyOptional({ type: 'enum', enum: ESalaryStatus })
    @IsOptional()
    @IsEnum(ESalaryStatus)
    status: ESalaryStatus;
}