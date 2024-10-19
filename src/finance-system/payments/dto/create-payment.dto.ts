import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsString, IsUUID } from "class-validator";
import { EPaymentMethod } from "src/core/types/global.types";

export class CreatePaymentDto {
    @ApiProperty({ type: String, format: 'date-time', description: 'Date of the payment' })
    @IsDateString()
    @IsNotEmpty()
    date: string;

    @ApiProperty({ type: Number, description: 'Amount paid' })
    @IsNotEmpty()
    @IsNumber()
    paidAmount: number;

    @ApiProperty({ type: String, description: 'Short description of the payment' })
    @IsNotEmpty()
    @IsString()
    shortDescription: string;

    @ApiProperty({ type: 'enum', enum: EPaymentMethod, description: 'Payment method' })
    @IsNotEmpty()
    @IsEnum(EPaymentMethod)
    paymentMethod: EPaymentMethod;

    @ApiProperty({ type: String, description: 'Payment reference' })
    @IsNotEmpty()
    @IsString()
    paymentReference: string;

    @ApiProperty({ type: Boolean, description: 'Is TDS' })
    @IsNotEmpty()
    @IsBoolean()
    isTds: boolean;

    @ApiProperty({ type: String, description: 'Dealer id' })
    @IsUUID()
    @IsNotEmpty()
    dealerId: string;
}
