import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { EPaymentMethod } from 'src/common/types/global.type';

export class UpdateFeesInvoiceDto {
    @ApiPropertyOptional({ enum: EPaymentMethod })
    @IsEnum(EPaymentMethod)
    @IsNotEmpty()
    paymentMethod: EPaymentMethod;
}
