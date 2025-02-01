import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Length, Min } from "class-validator";
import { EPaymentMethod } from "src/common/types/global.type";

export class CreateFeePaymentDto {
    @ApiProperty({ format: 'uuid', description: 'Fee invoice id' })
    @IsUUID()
    feeInvoiceId: string;

    @ApiProperty({ description: 'Paid amount', type: 'number', minimum: 0 })
    @IsNumber()
    @Min(0)
    paidAmount: number;

    @ApiProperty({ description: 'Remark', maxLength: 100 })
    @IsString()
    @IsOptional()
    @Length(0, 100, { message: 'Remark must be less than 100 characters' })
    remark?: string;

    @ApiProperty({ enum: EPaymentMethod, description: 'Payment method' })
    @IsEnum(EPaymentMethod)
    paymentMethod: EPaymentMethod;
}

export class LibraryFinePaymentDto {
    @ApiProperty({ description: 'Student id' })
    @IsUUID()
    studentId: string;

    @ApiProperty({ enum: EPaymentMethod, description: 'Payment method' })
    @IsEnum(EPaymentMethod)
    paymentMethod: EPaymentMethod;
}