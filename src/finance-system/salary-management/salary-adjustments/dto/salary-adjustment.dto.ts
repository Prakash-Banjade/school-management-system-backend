import { IsEnum, IsNotEmpty, IsNumber, IsString, Length, Min } from "class-validator";
import { ApiProperty, OmitType } from "@nestjs/swagger";
import { ESalaryAdjustmentType } from "../entities/salary-adjustment.entity";

export class SalaryAdjustmentDto {
    @ApiProperty()
    @IsEnum([ESalaryAdjustmentType.Bonus, ESalaryAdjustmentType.Deduction])
    type: ESalaryAdjustmentType;

    @ApiProperty()
    @IsNumber()
    @Min(0, { message: 'Amount cannot be less than 0' })
    amount: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @Length(0, 50, { message: 'Description must be less than 50 characters' })
    description: string;
}