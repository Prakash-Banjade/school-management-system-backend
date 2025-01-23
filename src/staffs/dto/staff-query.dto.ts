import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";
import { EStaff } from "src/common/types/global.type";

export class StaffQueryDto extends QueryDto {
    @ApiPropertyOptional()
    @IsString({ each: true })
    @IsOptional()
    @Transform(({ value }) => {
        if (value) return value.split(',');
        return [];
    })
    type?: EStaff[];

    @ApiPropertyOptional()
    @IsString({ each: true })
    @IsOptional()
    @Transform(({ value }) => {
        return value?.split(',') ?? [];
    })
    departmentIds?: string[] = [];
}