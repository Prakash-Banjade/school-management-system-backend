import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from "class-validator";
import { ESalaryAdjustmentType } from "../entities/salary-adjustment.entity";
import { ApiProperty } from "@nestjs/swagger";

export class CreateSalaryAdjustmentDto {
    @ApiProperty()
    @IsEnum(ESalaryAdjustmentType)
    type: ESalaryAdjustmentType;

    @ApiProperty()
    @IsNumber()
    @Min(0, { message: 'Amount cannot be less than 0' })
    amount: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    description: string;
}