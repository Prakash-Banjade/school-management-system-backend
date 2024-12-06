import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsDateString, IsEnum, IsOptional, IsUUID, ValidateIf, ValidateNested } from "class-validator";
import { EMonth } from "src/common/types/months";
import { CreateSalaryAdjustmentDto } from "../../salary-adjustments/dto/create-salary-adjustment.dto";
import { Type } from "class-transformer";
import { BadRequestException } from "@nestjs/common";

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
}