import { ApiProperty } from "@nestjs/swagger";
import { IAllowance } from "../entities/salary-structure.entity";
import { IsNotEmpty, IsNumber, IsString, Min } from "class-validator";

export class AllowanceDto implements IAllowance {
    @ApiProperty({ type: Number, example: 1000, description: 'Amount of the allowance' })
    @IsNumber()
    @Min(0)
    amount!: number;

    @ApiProperty({ type: "string", example: 'Allowance title', description: 'Title of the allowance' })
    @IsString()
    @IsNotEmpty()
    title!: string;
}