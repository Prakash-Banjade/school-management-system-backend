import { ApiProperty, ApiPropertyOptional, OmitType } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsDateString, IsDefined, IsEnum, IsNotEmpty, IsUUID, ValidateNested } from "class-validator";
import { CreateFeeItemDto } from "./create-fee-item.dto";
import { Type } from "class-transformer";
import { EFeeInvoicePaymentStatus, EPaymentMethod } from "src/common/types/global.type";

class FeeItemDto extends OmitType(CreateFeeItemDto, ['feeInvoiceId']) { }

export class CreateFeesInvoiceDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    @IsNotEmpty()
    studentId: string;

    @ApiProperty({ format: 'date-time' })
    @IsDateString()
    @IsNotEmpty()
    createDate: string;

    @ApiProperty({ format: 'date-time' })
    @IsDateString()
    @IsNotEmpty()
    dueDate: string;

    @ApiProperty({ enum: EFeeInvoicePaymentStatus })
    @IsEnum(EFeeInvoicePaymentStatus)
    @IsNotEmpty()
    paymentStatus: EFeeInvoicePaymentStatus;

    @ApiPropertyOptional({ enum: EPaymentMethod })
    @IsEnum(EPaymentMethod)
    @IsNotEmpty()
    paymentMethod: EPaymentMethod;

    @ApiProperty({ type: [FeeItemDto], isArray: true })
    @IsArray()
    @ArrayMinSize(1)
    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => FeeItemDto)
    @IsDefined()
    feeItems: FeeItemDto[]

}
