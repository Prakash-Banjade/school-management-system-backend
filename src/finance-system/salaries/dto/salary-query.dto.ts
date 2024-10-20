import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";
import { ESalaryStatus } from "src/common/types/global.type";

export class SalaryQueryDto extends QueryDto {
    @ApiPropertyOptional({ type: 'enum', enum: ESalaryStatus })
    @IsOptional()
    @IsEnum(ESalaryStatus)
    status: ESalaryStatus;
}