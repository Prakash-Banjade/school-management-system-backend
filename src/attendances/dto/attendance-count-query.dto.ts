import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class AttendanceCountQueryDto {
    @ApiPropertyOptional({ format: 'uuid', description: 'Account id' })
    @IsOptional()
    @IsString()
    accountId?: string;

    @ApiPropertyOptional({ type: Number, description: 'Year of the attendance' })
    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => {
        return !isNaN(Number(value))
            ? Math.abs(Number(value))
            : undefined;
    })
    year?: number = new Date().getFullYear();

    @ApiPropertyOptional({ type: Number, description: 'Month of the attendance' })
    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => {
        return !isNaN(Number(value))
            ? Math.abs(Number(value))
            : undefined;
    })
    month?: number = new Date().getMonth() + 1;

    @ApiPropertyOptional({ type: Boolean, default: false, description: 'Only monthly flag' })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    onlyMonthly: boolean = false;
}