import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export enum ERouteStopSortBy {
    Sequence = 'sequence',
}

export class RouteStopQueryDto extends QueryDto {
    @ApiPropertyOptional()
    @IsEnum(ERouteStopSortBy)
    @IsOptional()
    sortBy?: string;
}