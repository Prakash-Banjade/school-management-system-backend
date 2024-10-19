import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from "class-validator";

export class CreateFeeItemDto {
    @ApiProperty({ format: 'uuid' })
    @IsNotEmpty()
    @IsUUID()
    feesTypeId: string;

    @ApiProperty({ format: 'uuid' })
    @IsNotEmpty()
    @IsUUID()
    feeInvoiceId: string;

    @ApiProperty({ default: 0 })
    @IsNumber()
    @IsOptional()
    @Min(0)
    waiver: number = 0;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    paidAmount: number;
}