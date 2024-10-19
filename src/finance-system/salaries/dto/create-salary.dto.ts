import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsUUID } from "class-validator";
import { ESalaryStatus } from "src/core/types/global.types";

export class CreateSalaryDto {
    @ApiPropertyOptional({ type: Number, description: 'Salary ID' })
    @IsInt()
    @IsOptional()
    salaryId: number;

    @ApiPropertyOptional({ type: Number, description: 'Bonus', default: 0 })
    @IsNumber()
    @IsOptional()
    bonus: number = 0;

    @ApiPropertyOptional({ type: Number, description: 'Deduction', default: 0 })
    @IsNumber()
    @IsOptional()
    deduction: number = 0;

    @ApiPropertyOptional({ type: Number, description: 'Wage', default: 0 })
    @IsNumber()
    @IsOptional()
    wage: number;

    @ApiProperty({ type: String, format: 'date', description: 'Salary Date' })
    @IsDateString()
    salaryDate: string;

    @ApiPropertyOptional({ type: String, description: 'Salary Status', enum: ESalaryStatus })
    @IsEnum(ESalaryStatus)
    @IsOptional()
    status: ESalaryStatus = ESalaryStatus.PENDING;

    @ApiProperty({ type: String, description: 'User ID' })
    @IsUUID()
    @IsNotEmpty()
    userId: string
}
