import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from "class-validator";
import { SalaryAdjustmentDto } from "../../salary-adjustments/dto/salary-adjustment.dto";
import { Type } from "class-transformer";

export class CreatePayrollDto {
    @ApiPropertyOptional({ type: [SalaryAdjustmentDto], isArray: true, description: 'Salary adjustments array' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SalaryAdjustmentDto)
    @IsOptional()
    salaryAdjustments: SalaryAdjustmentDto[] = [];

    @ApiProperty({ format: 'uuid', description: 'Employee id' })
    @IsUUID()
    employeeId: string;

    @ApiPropertyOptional({ type: 'number', description: 'Advance amount if any' })
    @IsOptional()
    @IsNumber()
    @Min(0, { message: 'Advance amount must be greater than or equal to 0' })
    advance: number = 0;

    @ApiProperty({ enum: ['teacher', 'staff'], description: 'Employee type' })
    @IsOptional()
    @IsString()
    employeeType: 'teacher' | 'staff' = 'teacher'; // this is needed to determine which table to use
}

export class UpdatePayrollDto {
    @ApiPropertyOptional({ type: 'number', description: 'Advance amount if any' })
    @IsOptional()
    @IsNumber()
    @Min(0, { message: 'Advance amount must be greater than or equal to 0' })
    advance: number = 0;

    @ApiPropertyOptional({ type: [SalaryAdjustmentDto], isArray: true, description: 'Salary adjustments array' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SalaryAdjustmentDto)
    @IsOptional()
    salaryAdjustments: SalaryAdjustmentDto[] = [];
}