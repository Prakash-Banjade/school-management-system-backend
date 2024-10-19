import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";

export class UpdateFeeItemDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    amount: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    waiver: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    paidAmount: number;
}