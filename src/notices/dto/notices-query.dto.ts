import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class NoticesQueryDto extends QueryDto {

    @ApiPropertyOptional({ type: 'boolean', default: false, description: 'Only recent notices' })
    @Transform(({ value }) => value === 'true')
    @IsOptional()
    @IsBoolean()
    recent: boolean = false;
}