import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNumber, IsOptional } from "class-validator";

export class AttendanceCountQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    accountId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Transform(({value}) => {
        return !isNaN(Number(value))
            ? Math.abs(Number(value))
            : undefined;
    })
    year?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Transform(({value}) => {
        return !isNaN(Number(value))
            ? Math.abs(Number(value))
            : undefined;
    })
    month?: number;
}