import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateFeesInvoiceDto } from './create-fees-invoice.dto';
import { EPaymentMethod } from 'src/core/types/global.types';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateFeesInvoiceDto {
    @ApiPropertyOptional({ enum: EPaymentMethod })
    @IsEnum(EPaymentMethod)
    @IsNotEmpty()
    paymentMethod: EPaymentMethod;
}
