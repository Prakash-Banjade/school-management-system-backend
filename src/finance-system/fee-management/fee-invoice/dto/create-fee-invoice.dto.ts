import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Length, Max, Min, ValidateNested } from "class-validator";
import { EMonth } from "src/common/types/months";

class InvoiceItemsDto {
    @ApiProperty()
    @IsNumber()
    @Min(0)
    amount: number;

    @ApiProperty()
    @IsUUID()
    chargeHeadId: string;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    @Max(100)
    discount: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    @Length(0, 100, { message: 'Remark must be less than 100 characters' })
    remark?: string;
}

export class CreateFeeInvoiceDto {
    @ApiProperty()
    @IsUUID()
    studentId: string;

    @ApiProperty()
    @IsDateString()
    dueDate: string;

    @ApiProperty()
    @IsDateString()
    invoiceDate: string;

    @ApiProperty({ enum: EMonth })
    @IsEnum(EMonth)
    month: EMonth;

    @ApiProperty()
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => InvoiceItemsDto)
    invoiceItems: InvoiceItemsDto[];
}