import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";
import { EPaymentMethod } from "src/common/types/global.type";

export class CreateFeePaymentDto {
    @ApiProperty()
    @IsUUID()
    feeInvoiceId: string;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    paidAmount: number;

    @ApiProperty()
    @IsString()
    @IsOptional()
    remark?: string;

    @ApiProperty({ enum: EPaymentMethod })
    @IsEnum(EPaymentMethod)
    paymentMethod: EPaymentMethod;
}