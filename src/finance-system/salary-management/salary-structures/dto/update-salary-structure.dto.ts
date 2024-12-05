import { ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayMaxSize, IsArray, IsNumber, IsOptional, Min, ValidateNested } from "class-validator";
import { AllowanceDto } from "./create-salary-structure.dto";
import { Type } from "class-transformer";

export class UpdateSalaryStructureDto {
    @ApiPropertyOptional({ type: Number, example: 10000, description: 'Baisc salary of the teacher' })
    @Min(0)
    @IsNumber()
    @IsOptional()
    basicSalary?: number;

    @ApiPropertyOptional({ type: [AllowanceDto], description: 'Allowances of the teacher' })
    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => AllowanceDto)
    @ArrayMaxSize(3, { message: 'Maximum 3 allowances allowed' })
    allowances?: AllowanceDto[] = [];
}