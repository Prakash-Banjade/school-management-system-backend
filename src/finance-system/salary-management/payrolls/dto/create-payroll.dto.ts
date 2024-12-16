import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsDateString, IsNumber, IsOptional, IsUUID, Min, ValidateNested } from "class-validator";
import { CreateSalaryAdjustmentDto } from "../../salary-adjustments/dto/create-salary-adjustment.dto";
import { Type } from "class-transformer";

export class CreatePayrollDto {
    @ApiProperty()
    @IsDateString()
    date: string;

    @ApiPropertyOptional({ type: CreateSalaryAdjustmentDto, isArray: true })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSalaryAdjustmentDto)
    @IsOptional()
    salaryAdjustments: CreateSalaryAdjustmentDto[] = [];

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    employeeId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0, { message: 'Advance amount must be greater than or equal to 0' })
    advance?: number;
}