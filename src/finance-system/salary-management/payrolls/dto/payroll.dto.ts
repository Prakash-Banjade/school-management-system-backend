import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsDateString, IsNumber, IsOptional, IsUUID, Min, ValidateNested } from "class-validator";
import { CreateSalaryAdjustmentDto } from "../../salary-adjustments/dto/create-salary-adjustment.dto";
import { Type } from "class-transformer";

export class CreatePayrollDto {
    @ApiProperty({ type: 'string', format: 'date-time', description: "Payroll creation date" })
    @IsDateString()
    date: string;

    @ApiPropertyOptional({ type: [CreateSalaryAdjustmentDto], isArray: true, description: 'Salary adjustments array' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSalaryAdjustmentDto)
    @IsOptional()
    salaryAdjustments: CreateSalaryAdjustmentDto[] = [];

    @ApiProperty({ format: 'uuid', description: 'Employee id' })
    @IsUUID()
    employeeId: string;

    @ApiPropertyOptional({ type: 'number', description: 'Advance amount if any' })
    @IsOptional()
    @IsNumber()
    @Min(0, { message: 'Advance amount must be greater than or equal to 0' })
    advance?: number;
}

export class UpdatePayrollDto {
    @ApiPropertyOptional({ type: 'number', description: 'Advance amount if any' })
    @IsOptional()
    @IsNumber()
    @Min(0, { message: 'Advance amount must be greater than or equal to 0' })
    advance?: number;

    @ApiPropertyOptional({ type: [CreateSalaryAdjustmentDto], isArray: true, description: 'Salary adjustments array' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSalaryAdjustmentDto)
    @IsOptional()
    salaryAdjustments: CreateSalaryAdjustmentDto[] = [];
}